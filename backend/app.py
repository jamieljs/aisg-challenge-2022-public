import base64
import pipeline
import awstools
import subprocess
from uuid import uuid4
from datetime import datetime, timedelta

def overlap(box1, box2):
	# Each of these are 4 integers
	# Take the overlap area (both x and y overlap)
	# Divide by total areas 
	totalArea = (box1[2] - box1[0]) * (box1[3] - box1[1]) + (box2[2] - box2[0]) * (box2[3] - box2[1])
	if totalArea == 0: return False
	# Overlap area
	ht = min(box1[2], box2[2]) - max(box1[0], box2[0])
	wt = min(box1[3], box2[3]) - max(box1[1], box2[1])
	area = max(0, ht) * max(0, wt)

	rat = area * 2 / totalArea
	# Return positive if the overlap area is within 0.8 of total area
	return (rat) > 0.8

def lambda_handler(event, context):

	imgPath = f"{str(uuid4())}.jpg"
	CameraId = event["CameraId"]
	imgData = base64.b64decode(event["img"])
	subprocess.run(f"touch {imgPath}", shell=True)
	with open(imgPath, "wb") as f:
		f.write(imgData)

	output = pipeline.main(imgpath = f"{imgPath}")
	curtime = datetime.utcnow()+timedelta(hours=8)
	timestamp = curtime.strftime("%Y-%m-%d %X")
	persons = len(output['IsLooking'])
	PersonId = [None for i in range(persons)]
	subprocess.run(f"rm {imgPath}", shell=True)

	# Last 3 frames should be ordered with 0 as latest frame and 2 as latest
	Last3Frames = awstools.getLast3Frames(CameraId)

	# Check for ovverlap between bboxes with previous frame
	for frame in Last3Frames:
		frame_persons = len(frame['IsLooking'])
		for i in range(persons):
			if (PersonId[i] != None): continue
			for j in range(frame_persons):
				# If current frame overlaps with previous, then we take it they are same person
				if overlap(frame['bboxes'][j], output['bboxes'][i]):
					PersonId[i] = frame['PersonId'][j]
					print(f"OVERLAP with person {PersonId[i]}")
					break

	# Allocate new IDs to new people, update the total number of frames for each user
	for i in range(persons):
		if PersonId[i] != None:
			awstools.updatePerson(CameraId, PersonId[i], output['IsLooking'][i])
		else:
			PersonId[i] = str(uuid4())
			# CREATE NEW USER
			newPersonInput = {
				'CameraId': CameraId,
				'PersonId': PersonId[i], 
				'Age': output['age_list'][i],
				'Gender': output['gender_list'][i],
				'FirstTimestamp': timestamp,
				'LastTimestamp': '',
				'PositiveFrames': output['IsLooking'][i],
				'TotalFrames': 1,
			}
			awstools.createNewPerson(newPersonInput)

	# A person is considered INACTIVE if he/she does not appear in 3 consecutive frames
	if len(Last3Frames) == 3:
		# Generating list of PersionId in 3 active frames
		activePersons = [i for i in PersonId]
		activePersons += Last3Frames[1]['PersonId']
		activePersons += Last3Frames[0]['PersonId']
		activePersons = list(set(activePersons))

		StopPersons = len(Last3Frames[2]['PersonId'])
		StopTimestamp = Last3Frames[2]['Timestamp']
		for i in range(StopPersons):
			personId = Last3Frames[2]['PersonId'][i]
			if personId in activePersons: continue
			# Terminate frame
			print("TERMINATE")
			awstools.terminatePerson(CameraId, personId, StopTimestamp)

	dynamoInput = {
		'CameraId': CameraId,
		'IsLooking': output['IsLooking'],
		'Timestamp': timestamp,
		'PersonId': PersonId,
		'Age': output['age_list'],
		'Genders': output['gender_list'],
		'bboxes': output['bboxes']
	}

	awstools.createNewImage(dynamoInput)

	dynamoInput.pop('bboxes')

	return dynamoInput

if __name__ == '__main__':
	pass