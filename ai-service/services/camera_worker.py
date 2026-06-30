import cv2

from core.tracker import Tracker
from core.counter import Counter
from core.statistics import Statistics


class CameraWorker:

    def __init__(self, camera_config, detector):

        self.config = camera_config
        self.detector = detector

        self.cap = cv2.VideoCapture(camera_config.source)

        if not self.cap.isOpened():
            raise Exception(f"Cannot open camera: {camera_config.source}")

        self.tracker = Tracker(camera_config.tracker)

        self.counter = Counter(
            detector=self.detector,
            tracker=self.tracker,
            region=camera_config.region
        )

        self.statistics = Statistics()

        self.window_name = f"{camera_config.camera_id} - {camera_config.name}"

    def run(self):

        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)

        while self.cap.isOpened():

            success, frame = self.cap.read()

            if not success:
                break

            results = self.counter.process(frame)

            self.statistics.update(
                self.counter.in_count,
                self.counter.out_count
            )

            cv2.imshow(
                self.window_name,
                results.plot_im
            )

            if cv2.waitKey(1) & 0xFF == 27:
                break

        self.cap.release()

        print(f"{self.window_name} stopped.")