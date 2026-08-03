from dataclasses import dataclass
from typing import Optional

@dataclass
class CameraConfig:

    camera_id: int

    name: str

    source: str

    region: list

    tracker: str

    enabled: bool

    max_fps: Optional[float] = None