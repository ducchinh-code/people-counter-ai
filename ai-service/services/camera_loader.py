import os
import requests
from core.camera_config import CameraConfig
from utils.logger import get_logger

logger = get_logger("camera_loader")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")


class CameraLoader:

    @staticmethod
    def load_from_backend():
        try:
            response = requests.get(
                f"{BACKEND_URL}/api/cameras/enabled",
                timeout=5
            )
            response.raise_for_status()

            cameras = []
            for cam in response.json()["data"]:
                cameras.append(CameraConfig(
                    camera_id=cam["id"],
                    name=cam["name"],
                    source=cam["source"],
                    region=cam["region"],
                    tracker=cam["tracker"],
                    enabled=cam["enabled"]
                ))

            logger.info(f"Loaded {len(cameras)} cameras from backend")
            return cameras

        except Exception as e:
            logger.error(f"Failed to load cameras from backend: {e}")
            logger.info("Falling back to cameras.json")
            return CameraLoader.load("data/cameras.json")

    @staticmethod
    def load(path):
        import json
        with open(path, "r") as f:
            data = json.load(f)
        return [CameraConfig(**cam) for cam in data]