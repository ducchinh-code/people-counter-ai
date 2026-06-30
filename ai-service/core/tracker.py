class Tracker:

    def __init__(self, tracker_name="botsort.yaml"):

        self.tracker_name = tracker_name

    @property
    def name(self):

        return self.tracker_name