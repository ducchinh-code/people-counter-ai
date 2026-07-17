from ultralytics import solutions
from ultralytics.utils import LOGGER as ultralytics_logger
import logging

ultralytics_logger.setLevel(logging.ERROR)

CONF_THRESHOLD = 0.5

class Counter:

    def __init__(
            self,
            detector,
            tracker,
            region
    ):

        self.counter = solutions.ObjectCounter(

            show=False,

            model=detector.get_model(),

            tracker=tracker.name,

            region=region,

            classes=[0],

            conf = CONF_THRESHOLD,

            verbose=False,

            imgsz=640
        )

    def process(self, frame):

        return self.counter(frame)

    @property
    def in_count(self):

        return self.counter.in_count

    @property
    def out_count(self):

        return self.counter.out_count