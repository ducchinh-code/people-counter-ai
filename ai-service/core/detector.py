import os
from pathlib import Path
from ultralytics import YOLO


class Detector:

    def __init__(self, model_name=None):
        model_name = model_name or os.getenv("MODEL_NAME", "best.pt")

        base_dir = Path(__file__).resolve().parent.parent

        model_path = base_dir / "models" / model_name

        if not model_path.exists():
            raise FileNotFoundError(
                f"Khong tim thay model tai {model_path}. "
                f"Hay copy file/thu muc model da train vao {base_dir / 'models'}."
            )

        self.model = YOLO(str(model_path))

    def get_model(self):
        return self.model