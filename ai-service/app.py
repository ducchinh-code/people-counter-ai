from services.camera_loader import CameraLoader
from services.camera_manager import CameraManager


def main():

    manager = CameraManager()

    cameras = CameraLoader.load("data/cameras.json")

    for camera in cameras:

        if camera.enabled:
            manager.add_camera(camera)

    manager.start()


if __name__ == "__main__":
    main()