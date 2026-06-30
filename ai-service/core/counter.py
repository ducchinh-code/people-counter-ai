from ultralytics import solutions


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

            classes=[0]

        )

    def process(self, frame):

        return self.counter(frame)

    @property
    def in_count(self):

        return self.counter.in_count

    @property
    def out_count(self):

        return self.counter.out_count