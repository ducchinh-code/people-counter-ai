from pathlib import Path
from ultralytics import YOLO


class Detector:

    def __init__(self, model_name="yolo11s.pt"):

        base_dir = Path(__file__).resolve().parent.parent

        model_path = base_dir / "models" / model_name

        self.model = YOLO(str(model_path))

    def get_model(self):
        return self.model