from dotenv import load_dotenv
import os

load_dotenv()

def wait_for_backend(url, timeout=60):
    import time
    import requests
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
    return False


def main():
    from services.camera_loader import CameraLoader
    from services.camera_manager import CameraManager
    from services.camera_sync import CameraSync

    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
    wait_for_backend(backend_url)

    manager = CameraManager()

    sync = CameraSync(backend_url, manager)
    sync.start()

    cameras = CameraLoader.load_from_backend()
    for camera in cameras:
        if camera.enabled:
            manager.add_camera(camera)

    manager.start()


if __name__ == "__main__":
    main()