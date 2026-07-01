def run_camera(camera_config):

    import logging
    logging.getLogger("ultralytics").setLevel(logging.ERROR)

    from core.detector import Detector
    from services.camera_worker import CameraWorker
    from services.api_client import ApiClient

    detector = Detector()
    api_client = ApiClient()

    worker = CameraWorker(camera_config, detector, api_client)

    worker.run()