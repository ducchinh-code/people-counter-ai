import multiprocessing as mp
import threading
import time
import signal
from utils.logger import get_logger
from utils.process_runner import run_camera

logger = get_logger("camera_manager")


class CameraManager:

    def __init__(self):
        self.processes = {}
        self._stop_event = threading.Event()

        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum, frame):
            logger.info(f"Received signal {signum} — sẽ dừng an toàn tất cả camera")
            self._stop_event.set()

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

    def _terminate_camera(self, camera_id):
        p = self.processes.get(camera_id)
        if p and p.is_alive():
            p.terminate()

    def _wait_camera_stopped(self, camera_id, timeout=20):
        p = self.processes.get(camera_id)
        if p:
            p.join(timeout=timeout)
            if p.is_alive():
                logger.warning(f"Camera {camera_id} không dừng kịp trong {timeout}s, buộc kill")
                p.kill()
            else:
                logger.info(f"Stopped camera {camera_id}")
        self.processes.pop(camera_id, None)

    def stop_camera(self, camera_id):
        self._terminate_camera(camera_id)
        self._wait_camera_stopped(camera_id)

    def start(self):

            if not self.processes:
                logger.warning("No cameras loaded")

            while not self._stop_event.is_set():

                dead = [
                    cid for cid, p in self.processes.items()
                    if not p.is_alive()
                ]
                for cid in dead:
                    logger.warning(f"Camera {cid} process died unexpectedly")
                    self.processes.pop(cid)

                time.sleep(1)

            logger.info("Shutting down all cameras...")

            camera_ids = list(self.processes.keys())

            for camera_id in camera_ids:
                self._terminate_camera(camera_id)

            for camera_id in camera_ids:
                self._wait_camera_stopped(camera_id, timeout=20)