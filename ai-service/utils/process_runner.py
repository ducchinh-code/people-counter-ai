def run_camera(camera_config):

    import logging
    logging.getLogger("ultralytics").setLevel(logging.ERROR)

    from core.detector import Detector
    from services.camera_worker import CameraWorker

    detector = Detector()

    worker = CameraWorker(camera_config, detector)

    worker.run()