import cv2
import base64
from time import sleep
import requests

DELAY = 1 # delay can be 1 or 60 seconds
CONSEC_EMPTY = 0 # numebr of consec empty frames
URL = 'http://127.0.0.1:8000/'
CameraId = "34578256nfids"

while True:
	# capture image
	with open("people.jpg", "rb") as f:
		raw = f.read()
		img = base64.b64encode(raw)
		# Do HTTP query
		params = {"img": img, "CameraId": CameraId}

		r = requests.post(url = URL, params = params)

		print(r.text)

		sleep(2)
		break