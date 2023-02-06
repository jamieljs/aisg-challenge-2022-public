import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
logs = dynamodb.Table('aisglogs')
persons = dynamodb.Table('aisgusers')

# Create new image entry (first db)
def createNewImage(obj):
	logs.put_item(Item = obj)
	# CameraId
	# Timestamp
	# Ages
	# PersonId (list of hashes)
	# is_looking
	# Genders
	# bboxes

# Get last 3 images (first db)
def getLast3Frames(CameraId):
	return logs.query(
		KeyConditionExpression = Key('CameraId').eq(CameraId),
		ScanIndexForward=False,
		Limit=3
	)['Items']
# (Basically do a pairwise check if things lineup)

# Create new user 
def createNewPerson(obj):
	resp = persons.put_item(Item = obj)
	# PersonId (from last image)
	# Camera Id
	# First timestamp
	# Last timestamp
	# Positive Frames
	# Total Frames
	# Age
	# Gender

# Updates new frame for user (either positively or negatively looking)
def updatePerson(CameraId, PersonId, isLooking):
	persons.update_item(
		Key = {'CameraId': CameraId, 'PersonId': PersonId},
		UpdateExpression = 'ADD #a :a, #b :b',
		ExpressionAttributeNames = {'#a': 'PositiveFrames', '#b': 'TotalFrames'},
		ExpressionAttributeValues = {':a': isLooking, ':b':1}
	)

# Updates the last timestamp of person id
def terminatePerson(CameraId, PersonId, timestamp):
	persons.update_item(
		Key = {'CameraId': CameraId, 'PersonId': PersonId},
		UpdateExpression = f'set LastTimestamp = {timestamp}'
	)