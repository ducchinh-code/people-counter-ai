from core.detector import Detector

from services.camera_loader import CameraLoader
from services.camera_manager import CameraManager

detector = Detector()

manager = CameraManager(detector)

cameras = CameraLoader.load("data/cameras.json")

for camera in cameras:

    if camera.enabled:

        manager.add_camera(camera)

manager.start()