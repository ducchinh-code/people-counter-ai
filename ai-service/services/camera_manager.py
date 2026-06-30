from concurrent.futures import ThreadPoolExecutor

from services.camera_worker import CameraWorker


class CameraManager:

    def __init__(self, detector):

        self.detector = detector
        self.workers = []

    def add_camera(self, camera_config):

        worker = CameraWorker(
            camera_config,
            self.detector
        )

        self.workers.append(worker)

    def start(self):

        if len(self.workers) == 0:
            print("No camera found.")
            return

        with ThreadPoolExecutor(
                max_workers=len(self.workers)
        ) as executor:

            for worker in self.workers:
                executor.submit(worker.run)