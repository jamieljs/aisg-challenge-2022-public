import numpy as np
from decimal import Decimal
from pathlib import Path
from peekingduck.pipeline.nodes.input import visual
from peekingduck.pipeline.nodes.model import mtcnn
from peekingduck.pipeline.nodes.draw import bbox
from peekingduck.pipeline.nodes.output import media_writer
from src.custom_nodes.model import gaze_tracking, age_detection

class Runner:
    def __init__(self, imgpath):
        self.visualNode = visual.Node(source=str(Path.cwd() / imgpath))
        self.mtcnnNode = mtcnn.Node()
        self.gazeTrackingNode = gaze_tracking.Node(pkd_base_dir=Path.cwd() / "src" / "custom_nodes")
        self.ageDetectionNode = age_detection.Node(pkd_base_dir=Path.cwd() / "src" / "custom_nodes")
        self.mediaWriterNode = media_writer.Node(output_dir = "output")
        self.bboxNode = bbox.Node(show_labels=True)
        self.raw_img = None
        self.proc_img = None

    def runOnce(self):
        img = self.visualNode.run({})["img"]
        bboxes = self.mtcnnNode.run({"img": img})["bboxes"]
        is_looking = self.gazeTrackingNode.run({"img": img, "bboxes": bboxes})
        output = self.ageDetectionNode.run({"img": img, "bboxes": bboxes})
        output["IsLooking"] = is_looking['is_looking']
        output["bboxes"] = bboxes

        self.raw_img = img.copy()
        draw_bboxes = []
        bbox_labels = []
        age_list = output["age_list"]
        gender_list = output["gender_list"]
        looking = is_looking['is_looking']
        # only append those that are looking
        for i in range(len(bboxes)):
            draw_bboxes.append(bboxes[i])
            if looking[i]:
                bbox_labels.append(f"{gender_list[i]} {age_list[i]}")
            else:
                bbox_labels.append("not looking")
        draw_bboxes = np.array(draw_bboxes)
        bbox_labels = np.array(bbox_labels)
        self.bboxNode.run({"img": img, "bboxes": draw_bboxes, "bbox_labels": bbox_labels})
        self.proc_img = img

        # Convert back to normal python for deployment
        output["age_list"] = [i for i in output["age_list"]]
        output["gender_list"] = [i for i in output["gender_list"]]
        output["IsLooking"] = [int(i) for i in output["IsLooking"]]
        # Converts output to decimal to use with Dyanmo
        output["bboxes"] = [[Decimal(float(i)) for i in box] for box in output["bboxes"]]
        return output
    
    def writeImage(self):
        if self.raw_img is not None:
            self.mediaWriterNode.run({"img": self.raw_img, "filename": "raw_img.png", "saved_video_fps": 1, "pipeline_end": False})
            self.mediaWriterNode.run({"img": self.proc_img, "filename": "proc_img.png", "saved_video_fps": 1, "pipeline_end": False})

def main(imgpath = "../client/people.jpg"):
    runner = Runner(imgpath)
    res = runner.runOnce()
    runner.writeImage()
    return res

if __name__ == '__main__':
    y = main()
    print("OUTPUT")
    print(y)