import json
import threading
import time
import websocket
from utils.logger import get_logger

logger = get_logger("camera_sync")


class CameraSync:

    def __init__(self, backend_url, camera_manager):
        self.camera_manager = camera_manager
        self.ws_url = backend_url.replace("http://", "ws://").replace("https://", "wss://")
        self.ws_url += "/ws/websocket"

    def start(self):
        thread = threading.Thread(
            target=self._connect_with_retry,
            daemon=True
        )
        thread.start()

    def _connect_with_retry(self):
        while True:
            try:
                self._connect()
            except Exception as e:
                logger.warning(f"WebSocket disconnected: {e} — reconnecting in 5s")
                time.sleep(5)

    def _connect(self):

        ws = websocket.WebSocketApp(
            self.ws_url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        ws.run_forever()

    def _on_open(self, ws):
        logger.info("WebSocket connected")

        # Gửi CONNECT frame theo STOMP protocol
        ws.send("CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\x00")

    def _on_message(self, ws, message):
        try:
            if message.startswith("CONNECTED"):
                ws.send("SUBSCRIBE\nid:sub-0\ndestination:/topic/cameras\n\n\x00")
                logger.info("Subscribed to /topic/cameras")
                return

            if message.startswith("MESSAGE"):
                parts = message.split("\n\n", 1)
                if len(parts) > 1:
                    body = parts[1].rstrip("\x00")
                    self._handle_camera_event(json.loads(body))

        except Exception as e:
            logger.error(f"Failed to handle message: {e}")

    def _on_error(self, ws, error):
        logger.warning(f"WebSocket error: {error}")

    def _on_close(self, ws, code, msg):
        logger.warning("WebSocket disconnected")

    def _handle_camera_event(self, data):
        from core.camera_config import CameraConfig

        camera_id = data["id"]
        enabled = data["enabled"]

        if enabled and camera_id not in self.camera_manager.processes:
            config = CameraConfig(
                camera_id=data["id"],
                name=data["name"],
                source=data["source"],
                region=data["region"],
                tracker=data["tracker"],
                enabled=data["enabled"]
            )
            self.camera_manager.add_camera(config)
            logger.info(f"Camera '{data['name']}' started via WebSocket")

        elif not enabled and camera_id in self.camera_manager.processes:
            self.camera_manager.stop_camera(camera_id)
            logger.info(f"Camera '{data['name']}' stopped via WebSocket")