from pathlib import Path

_TRACKER_DIR = Path(__file__).resolve().parent.parent / "config" / "trackers"

_ALIASES = {
    "botsort_reid.yaml": str(_TRACKER_DIR / "botsort_reid.yaml"),
}


class Tracker:

    def __init__(self, tracker_name="botsort.yaml"):
        self.tracker_name = _ALIASES.get(tracker_name, tracker_name)

    @property
    def name(self):
        return self.tracker_name