import os
from functools import partial

import requests
import time
from utils.logger import get_logger

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "")

logger = get_logger("api_client")


class ApiClient:

    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
        })
        logger.info(f"ApiClient init — BACKEND_URL={BACKEND_URL}, API_KEY={'***' if API_KEY else 'EMPTY'}")

    def push_hourly_stats(self, camera_id, hour, in_count, out_count):

        payload = {
            "cameraId": camera_id,
            "hour": hour,
            "inCount": in_count,
            "outCount": out_count,
            "partial": partial
        }

        self._post("/api/counter/hourly", payload)

    def push_frame(self, camera_id, frame_bytes):

        try:
            response = self.session.post(
                f"{self.base_url}/api/cameras/{camera_id}/frame",
                data=frame_bytes,
                headers={**self.session.headers, "Content-Type": "image/jpeg"},
                timeout=1
            )
            response.raise_for_status()

        except requests.exceptions.ConnectionError:
            logger.warning(f"push_frame cam{camera_id} — backend không kết nối được")

        except requests.exceptions.Timeout:
            logger.warning(f"push_frame cam{camera_id} — timeout")

        except requests.exceptions.HTTPError as e:
            logger.warning(f"push_frame cam{camera_id} — HTTP error: {e}")

        except Exception as e:
            logger.warning(f"push_frame cam{camera_id} failed: {e}")

    def _post(self, path, payload):

        try:
            response = self.session.post(
                f"{self.base_url}{path}",
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            logger.debug(f"POST {path} → {response.status_code}")

        except requests.exceptions.ConnectionError:
            logger.warning(f"POST {path} — backend không kết nối được")

        except requests.exceptions.Timeout:
            logger.warning(f"POST {path} — timeout")

        except requests.exceptions.HTTPError as e:
            logger.error(f"POST {path} — HTTP error: {e}")

    def push_snapshot(self, camera_id, current_in, current_out):

        try:
            response = self.session.put(
                f"{self.base_url}/api/counter/snapshot",
                params={
                    "cameraId": camera_id,
                    "currentIn": current_in,
                    "currentOut": current_out
                },
                timeout=2
            )
            response.raise_for_status()
            logger.debug(f"PUT /api/counter/snapshot cam{camera_id} → {response.status_code}")

        except requests.exceptions.ConnectionError:
            logger.warning(f"push_snapshot cam{camera_id} — backend không kết nối được")

        except requests.exceptions.Timeout:
            logger.warning(f"push_snapshot cam{camera_id} — timeout")

        except requests.exceptions.HTTPError as e:
            logger.warning(f"push_snapshot cam{camera_id} — HTTP error: {e}")

        except Exception as e:
            logger.warning(f"push_snapshot cam{camera_id} failed: {e}")