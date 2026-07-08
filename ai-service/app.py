import time
import requests
from dotenv import load_dotenv
import os

load_dotenv()

def wait_for_backend(url, timeout=60):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            response = requests.get(f"{url}/api-docs", timeout=3)
            if response.status_code == 200:
                print(f"Backend ready at {url}")
                return True
        except Exception:
            pass
        print("Waiting for backend...")
        time.sleep(3)
    print("Backend not ready after timeout")
    return False


def main():
    from services.camera_loader import CameraLoader
    from services.camera_manager import CameraManager

    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")

    wait_for_backend(backend_url)

    manager = CameraManager()
    cameras = CameraLoader.load("data/cameras.json")

    for camera in cameras:
        if camera.enabled:
            manager.add_camera(camera)

    manager.start()


if __name__ == "__main__":
    main()