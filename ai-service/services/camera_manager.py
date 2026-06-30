import multiprocessing as mp

from utils.process_runner import run_camera


class CameraManager:

    def __init__(self):
        self.camera_configs = []
        self.processes = []

    def add_camera(self, camera_config):
        self.camera_configs.append(camera_config)

    def start(self):

        if len(self.camera_configs) == 0:
            print("No camera found.")
            return

        for config in self.camera_configs:

            p = mp.Process(target=run_camera, args=(config,))
            p.start()
            self.processes.append(p)

        for p in self.processes:
            p.join()