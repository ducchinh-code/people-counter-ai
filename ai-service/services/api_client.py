import os
import requests
from utils.logger import get_logger

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "")

logger = get_logger("api_client")


class ApiClient:

    def __init__(self):
        self.base_url = BACKEND_URL
        self.headers = {
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def push_hourly_stats(self, camera_id, hour, in_count, out_count):
        """
        Push thống kê theo giờ lên backend.
        Gọi sau mỗi khi sang giờ mới.
        """

        payload = {
            "cameraId": camera_id,
            "hour": hour,
            "inCount": in_count,
            "outCount": out_count
        }

        self._post("/api/counter/hourly", payload)

    def push_snapshot(self, camera_id, current_in, current_out):
        """
        Push snapshot số liệu realtime lên backend.
        Gọi mỗi ~5 giây.
        """

        payload = {
            "cameraId": camera_id,
            "currentIn": current_in,
            "currentOut": current_out
        }

        self._put("/api/counter/snapshot", payload)

    def push_frame(self, camera_id, frame_bytes):
        """
        Push frame JPEG lên backend để stream cho frontend.
        Gọi mỗi frame khi HEADLESS=true.
        """

        try:
            self.session.post(
                f"{self.base_url}/api/cameras/{camera_id}/frame",
                data=frame_bytes,
                headers={
                    **self.session.headers,
                    "Content-Type": "image/jpeg"
                },
                timeout=1  # Timeout ngắn — bỏ qua nếu backend chậm
            )
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

    def _put(self, path, payload):

        try:
            response = self.session.put(
                f"{self.base_url}{path}",
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            logger.debug(f"PUT {path} → {response.status_code}")

        except requests.exceptions.ConnectionError:
            logger.warning(f"PUT {path} — backend không kết nối được")

        except requests.exceptions.Timeout:
            logger.warning(f"PUT {path} — timeout")

        except requests.exceptions.HTTPError as e:
            logger.error(f"PUT {path} — HTTP error: {e}")