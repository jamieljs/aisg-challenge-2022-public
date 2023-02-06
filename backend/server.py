# Testing flask server to expose local lambda endpoint
# API Gateway is used to expose produciton lambda endpoint
import app
import base64
from flask import Flask, request
from threading import Thread

application = Flask(__name__)

def runAI(lambda_input):
	app.lambda_handler(lambda_input,None)

@application.route('/', methods=['POST'])
def run():
	img = request.args.get('img')
	CameraId = request.args.get('CameraId')
	lambda_input = {"img": img, "CameraId": CameraId}
	x = Thread(target=runAI, args=(lambda_input,))
	x.start()

	return {'status': 200}

if __name__ == '__main__':
	application.run(port=8000, debug=True)

	# with open("../client/people.jpg", "rb") as f:
	# 	raw = f.read()
	# 	img = base64.b64encode(raw)

	# CameraId = "02fncdna"
	# lambda_input = {"img": img, "CameraId": CameraId}
	# app.lambda_handler(lambda_input,None)