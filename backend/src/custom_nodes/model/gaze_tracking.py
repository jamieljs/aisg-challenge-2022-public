"""
Node template for creating custom nodes.
"""

import numpy as np
from typing import Any, Dict
from .gaze_tracking_library.gaze_tracking import GazeTracking
from peekingduck.pipeline.nodes.abstract_node import AbstractNode


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

        self.gaze = GazeTracking()

    def find_gaze_direction(self, img, bboxes, bbox_labels, width, height, x_ori, y_ori):
        self.gaze.refresh(img)

        dir = "none"
        if self.gaze.is_right():
            dir = "right"
        elif self.gaze.is_left():
            dir = "left"
        elif self.gaze.is_center():
            dir = "center"
        
        for eye in [self.gaze.eye_left, self.gaze.eye_right]:
            if not eye:
                continue
            x1 = 10000
            y1 = 10000
            x2 = 0
            y2 = 0
            for x, y in eye.landmark_points:
                x1 = min(x1, x)
                x2 = max(x2, x)
                y1 = min(y1, y)
                y2 = max(y2, y)

            x1 += x_ori
            x2 += x_ori
            y1 += y_ori
            y2 += y_ori
            
            bboxes = np.vstack([bboxes, [x1 / height - 0.01, y1 / width - 0.01, x2 / height + 0.01, y2 / width + 0.01]])
            bbox_labels = np.append(bbox_labels, "")

            pupil = eye.pupil
            if not pupil:
                continue
            
            x, y = pupil.x, pupil.y
            if not x or not y:
                continue

            x += x1
            y += y1
            
            bboxes = np.vstack([bboxes, [x / height - 0.005, y / width - 0.005, x / height + 0.005, y / width + 0.005]])
            bbox_labels = np.append(bbox_labels, "")

        return (bboxes, bbox_labels, dir)

    def check_if_looking(self, img, bboxes):
        width, height, _ = img.shape

        x1, y1, x2, y2 = bboxes
        h_margin = (x2 - x1) / 5
        w_margin = (y2 - y1) / 5

        x1 = int(max(x1 - h_margin, 0) * height)
        x2 = int(min(x2 + h_margin, 1) * height)
        y1 = int(max(y1 - w_margin, 0) * width)
        y2 = int(min(y2 + w_margin, 1) * width)
        xc = (x1 + x2) / 2

        gaze_dir = "none"
        try:
            self.gaze.refresh(img)

            if self.gaze.is_right():
                gaze_dir = "right"
            elif self.gaze.is_left():
                gaze_dir = "left"
            elif self.gaze.is_center():
                gaze_dir = "center"
        except:
            pass

        face_pos = "center"
        if xc / height <= 0.35:
            face_pos = "right"
        elif xc / height >= 0.65:
            face_pos = "left"
        
        is_looking = False
        if gaze_dir == "center" and face_pos == "center":
            is_looking = True
        elif gaze_dir == "left" and face_pos == "right":
            is_looking = True
        elif gaze_dir == "right" and face_pos == "left":
            is_looking = True

        return is_looking

    def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:  # type: ignore
        """This node does gaze tracking.

        Args:
            inputs (dict): Dictionary with keys "img"

        Returns:
            outputs (dict): Dictionary with keys "is_looking".
        """

        img = inputs["img"]
        bboxes = inputs["bboxes"]

        # new_bboxes = np.empty((0,4), int)
        # new_bbox_labels = np.array([])

        is_looking = np.array([])

        for i in range(len(bboxes)):
            is_looking = np.append(is_looking, self.check_if_looking(img, bboxes[i]))

            # x1, y1, x2, y2 = bboxes[i]
            # h_margin = (x2 - x1) / 5
            # w_margin = (y2 - y1) / 5

            # x1 = int(max(x1 - h_margin, 0) * height)
            # x2 = int(min(x2 + h_margin, 1) * height)
            # y1 = int(max(y1 - w_margin, 0) * width)
            # y2 = int(min(y2 + w_margin, 1) * width)
            
            # try:
            #     cropped_img = img[y1:y2, x1:x2]
            #     new_bboxes, new_bbox_labels, dir = self.find_gaze_direction(cropped_img, new_bboxes, new_bbox_labels, width, height, x1, y1)
            #     new_bboxes = np.vstack([new_bboxes, bboxes[i]])
            #     new_bbox_labels = np.append(new_bbox_labels, dir)
            # except:
            #     pass
            
        # return {"bboxes": new_bboxes}
        return {"is_looking": is_looking}
