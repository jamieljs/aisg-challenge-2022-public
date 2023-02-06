import boto3
import random
import json
import uuid
dynamodb = boto3.resource('dynamodb','ap-southeast-1')
table = dynamodb.Table('aisgusers')

ages = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
genders = ['Male', 'Female']
number = [5, 5, 5, 5, 5, 5, 20, 400, 800, 600, 400, 500, 700, 500, 400, 300, 300, 500, 700, 700, 300, 20, 5, 5]
keys = ['CameraId', 'Timestamp', 'PersonId', 'Age', 'Gender', 'PositiveFrames', 'TotalFrames']

def genPid():
    return str(uuid.uuid4())

def genAge():
    return random.choice(ages)

def genDer():
    return random.choice(genders)

def genNum(time):
    return int(random.uniform(0.8, 1.2) * number[time])

def gen(cameraId):
    data = []
    for hour in range(0, 24):
        num = genNum(hour)
        for _ in range(num):
            entry = []
            entry.append(cameraId)
            timeStamp = f"2023-02-05 {hour:02}:{random.randint(0,59):02}:{random.randint(0,59):02}"
            entry.append(timeStamp)
            entry.append(genPid())
            entry.append(genAge())
            entry.append(genDer())
            totalFrames = random.randint(5, 10)
            posFrames = random.randint(1, totalFrames)
            entry.append(posFrames)
            entry.append(totalFrames)
            data.append(entry)
    return data

def writeData(data, cameraId):
    file = open(f'{cameraId}.txt', 'w')
    json.dump(data, file)
    file.close()

def updateDb(cameraId):
    file = open(f'{cameraId}.txt', 'r')
    data = json.load(file)
    file.close()
    for entry in data:
        table.put_item(Item = dict(zip(keys, entry)))

if __name__ == '__main__':
    for id in ["2h11h8p4ix", "a1l91i2en4", "s1n0w7ow13"]:
        data = gen(id)
        writeData(data, id)
        updateDb(id)