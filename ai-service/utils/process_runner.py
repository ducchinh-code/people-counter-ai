def run_camera(camera_config):
    from core.detector import Detector
    from services.camera_worker import CameraWorker

    detector = Detector()
    worker = CameraWorker(camera_config, detector)
    worker.run()