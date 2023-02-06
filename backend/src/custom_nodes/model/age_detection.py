"""
Node template for creating custom nodes.
"""

import os
import cv2
import numpy as np
from typing import Any, Dict
from peekingduck.pipeline.nodes.abstract_node import AbstractNode

dir = "src/custom_nodes/model/age_gender_detection_library/"

faceProto = dir + "opencv_face_detector.pbtxt"
faceModel = dir + "opencv_face_detector_uint8.pb"
ageProto = dir + "age_deploy.prototxt"
ageModel = dir + "age_net.caffemodel"
genderProto = dir + "gender_deploy.prototxt"
genderModel =  dir + "gender_net.caffemodel"

MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)
ageList = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
genderList = ['Male','Female']

class Node(AbstractNode):
    """This is a template class of how to write a node for PeekingDuck.

    Args:
        config (:obj:`Dict[str, Any]` | :obj:`None`): Node configuration.
    """

    def __init__(self, config: Dict[str, Any] = None, **kwargs: Any) -> None:
        super().__init__(config, node_path=__name__, **kwargs)

        # initialize/load any configs and models here
        # configs can be called by self.<config_name> e.g. self.filepath
        # self.logger.info(f"model loaded with configs: config")

        print(os.getcwd())

        self.faceNet = cv2.dnn.readNet(faceModel, faceProto)
        self.ageNet = cv2.dnn.readNet(ageModel, ageProto)
        self.genderNet = cv2.dnn.readNet(genderModel, genderProto)

    def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:  # type: ignore
        """This node does age and gender detection.

        Args:
            inputs (dict): Dictionary with keys "img"

        Returns:
            outputs (dict): Dictionary with keys "gender" and "age".
        """

        img = inputs["img"]
        width, height, _ = img.shape
        bboxes = inputs["bboxes"]

        age_list = np.array([])
        gender_list = np.array([])

        for i in range(len(bboxes)):
            x1, y1, x2, y2 = bboxes[i]
            h_margin = (x2 - x1) / 5
            w_margin = (y2 - y1) / 5

            x1 = int(max(x1 - h_margin, 0) * height)
            x2 = int(min(x2 + h_margin, 1) * height)
            y1 = int(max(y1 - w_margin, 0) * width)
            y2 = int(min(y2 + w_margin, 1) * width)

            face = img[y1:y2, x1:x2]
            blob = cv2.dnn.blobFromImage(face, 1.0, (227,227), MODEL_MEAN_VALUES, swapRB=False)
            self.genderNet.setInput(blob)
            genderPreds = self.genderNet.forward()
            gender = genderList[genderPreds[0].argmax()]
            gender_list = np.append(gender_list, gender)

            self.ageNet.setInput(blob)
            agePreds = self.ageNet.forward()
            age = ageList[agePreds[0].argmax()]
            age_list = np.append(age_list, age)
            
        return {"age_list": age_list, "gender_list": gender_list}
