import json

from core.camera_config import CameraConfig


class CameraLoader:

    @staticmethod
    def load(file_path):

        with open(file_path, "r", encoding="utf8") as f:

            data = json.load(f)

        cameras = []

        for item in data:

            cameras.append(

                CameraConfig(

                    camera_id=item["camera_id"],

                    name=item["name"],

                    source=item["source"],

                    region=item["region"],

                    tracker=item["tracker"],

                    enabled=item["enabled"]

                )

            )

        return cameras