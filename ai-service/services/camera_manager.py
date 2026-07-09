import multiprocessing as mp
import threading
import time

from utils.logger import get_logger
from utils.process_runner import run_camera

logger = get_logger("camera_manager")


class CameraManager:

    def __init__(self):
        self.processes = {}        
        self._stop_event = threading.Event()

    def add_camera(self, camera_config):
        if camera_config.camera_id in self.processes:
            logger.warning(f"Camera {camera_config.camera_id} already running")
            return

        p = mp.Process(
            target=run_camera,
            args=(camera_config,),
            daemon=True
        )
        p.start()
        self.processes[camera_config.camera_id] = p
        logger.info(f"Started camera {camera_config.camera_id} — {camera_config.name}")

    def stop_camera(self, camera_id):
        p = self.processes.get(camera_id)
        if p and p.is_alive():
            p.terminate()
            p.join(timeout=5)
            logger.info(f"Stopped camera {camera_id}")
        self.processes.pop(camera_id, None)

    def start(self):

        if not self.processes:
            logger.warning("No cameras loaded")

        try:
            while not self._stop_event.is_set():

                # Dọn process đã chết
                dead = [
                    cid for cid, p in self.processes.items()
                    if not p.is_alive()
                ]
                for cid in dead:
                    logger.warning(f"Camera {cid} process died unexpectedly")
                    self.processes.pop(cid)

                time.sleep(1)

        except KeyboardInterrupt:
            logger.info("Shutting down all cameras...")
            self._stop_event.set()
            for camera_id in list(self.processes.keys()):
                self.stop_camera(camera_id)