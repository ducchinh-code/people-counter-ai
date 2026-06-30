from dataclasses import dataclass

@dataclass
class CameraConfig:

    camera_id: int

    name: str

    source: str

    region: list

    tracker: str

    enabled: bool