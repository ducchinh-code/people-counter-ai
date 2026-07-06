import os
import signal
import time
from datetime import datetime
from pathlib import Path

import cv2

from core.tracker import Tracker
from core.counter import Counter
from core.statistics import Statistics
from utils.logger import get_logger

HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"


class CameraWorker:

    def __init__(self, camera_config, detector, api_client=None):

        self.config = camera_config
        self.detector = detector
        self.api_client = api_client
        self.logger = get_logger(f"camera.{camera_config.camera_id}")

        self.cap = cv2.VideoCapture(camera_config.source)

        if not self.cap.isOpened():
            self.logger.error(f"Cannot open camera source: {camera_config.source}")
            raise Exception(f"Cannot open camera: {camera_config.source}")

        self.tracker = Tracker(camera_config.tracker)

        self.counter = Counter(
            detector=self.detector,
            tracker=self.tracker,
            region=camera_config.region
        )

        self.statistics = Statistics()

        self.window_name = f"{camera_config.camera_id} - {camera_config.name}"

        self.csv_file_name = f"people_statistics_cam{camera_config.camera_id}.csv"
        self.chart_file_name = f"people_flow_cam{camera_config.camera_id}.png"
        self.video_file_name = f"people_video_cam{camera_config.camera_id}.mp4"

        self.current_hour = None
        self.loop_count = 0
        self._read_fail_count = 0
        self._stop_requested = False

        self.video_writer = None if HEADLESS else self._create_video_writer()

        signal.signal(signal.SIGTERM, self._handle_stop_signal)
        signal.signal(signal.SIGINT, self._handle_stop_signal)

    def _handle_stop_signal(self, signum, frame):
        self.logger.info(f"Received signal {signum} — sẽ dừng sau frame hiện tại")
        self._stop_requested = True

    def _reset_counter(self):

        self.counter = Counter(
            detector=self.detector,
            tracker=self.tracker,
            region=self.config.region
        )

    def _create_video_writer(self):

        Path("output").mkdir(exist_ok=True)

        fps = self.cap.get(cv2.CAP_PROP_FPS)

        if not fps or fps <= 0:
            fps = 25

        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        output_path = str(Path("output") / self.video_file_name)

        return cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    def run(self):

        self.logger.info(
            f"Started — source: {self.config.source} | "
            f"mode: {'headless' if HEADLESS else 'display'}"
        )

        if not HEADLESS:
            cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)

        self._start_label = datetime.now().strftime("%d/%m %H:%M")
        self._first_record = True

        self.current_hour = self._hour_key()
        self.statistics.start_new_hour()

        while not self._stop_requested:

            success, frame = self.cap.read()

            if not success:
                self._read_fail_count += 1

                if self._read_fail_count > 1:
                    self.logger.warning(
                        f"Đọc frame thất bại liên tiếp lần {self._read_fail_count} "
                        f"— nguồn: {self.config.source}"
                    )
                    time.sleep(min(1.0, 0.1 * self._read_fail_count))

                self.loop_count += 1
                self.logger.debug(f"Video looped (#{self.loop_count})")
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                self._reset_counter()
                continue

            self._read_fail_count = 0

            results = self.counter.process(frame)

            self.statistics.update(
                self.counter.in_count,
                self.counter.out_count
            )

            self._record_if_new_hour()

            annotated_frame = results.plot_im

            if HEADLESS:
                self._push_frame(annotated_frame)
            else:
                self.video_writer.write(annotated_frame)
                cv2.imshow(self.window_name, annotated_frame)
                if cv2.waitKey(1) & 0xFF == 27:
                    self._stop_requested = True

        self._cleanup()

    def _push_frame(self, frame):

        if self.api_client is None:
            return

        try:
            _, jpeg = cv2.imencode(
                ".jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 70]
            )
            self.api_client.push_frame(
                camera_id=self.config.camera_id,
                frame_bytes=jpeg.tobytes()
            )
        except Exception as e:
            self.logger.warning(f"Failed to push frame: {e}")

    def _hour_key(self):

        return datetime.now().strftime("%d/%m %H:00")

    def _record_if_new_hour(self):

        hour_label = self._hour_key()

        if hour_label != self.current_hour:

            if self._first_record:
                range_label = f"{self._start_label}-{hour_label} (partial)"
                self._first_record = False
            else:
                range_label = f"{self.current_hour}-{hour_label}"

            self.statistics.add_record(range_label)

            record = self.statistics.records[-1]

            self.logger.info(
                f"Hour recorded [{range_label}] — "
                f"IN={record['IN']}, OUT={record['OUT']}, TOTAL={record['TOTAL']}"
            )

            self.statistics.save_csv(self.csv_file_name)
            self.statistics.draw_chart(self.chart_file_name)

            # Push lên backend lưu DB
            if self.api_client is not None:
                try:
                    self.api_client.push_hourly_stats(
                        camera_id=self.config.camera_id,
                        hour=range_label,
                        in_count=record["IN"],
                        out_count=record["OUT"]
                    )
                except Exception as e:
                    self.logger.warning(f"Failed to push hourly stats: {e}")

            self.current_hour = hour_label
            self.statistics.start_new_hour()

    def _cleanup(self):
        """Giải phóng tài nguyên và lưu thống kê cuối."""

        self.cap.release()

        if self.video_writer is not None:
            self.video_writer.release()

        if not HEADLESS:
            cv2.destroyWindow(self.window_name)

        self._finalize_statistics()

        self.logger.info("Stopped")

    def _finalize_statistics(self):

        now_label = datetime.now().strftime("%d/%m %H:%M")

        start_label = self._start_label if self._first_record else self.current_hour
        range_label = f"{start_label}-{now_label} (partial)"

        self.statistics.add_record(range_label)
        record = self.statistics.records[-1]

        self.statistics.save_csv(self.csv_file_name)
        self.statistics.draw_chart(self.chart_file_name)

        # Push record partial lên backend
        if self.api_client is not None:
            try:
                self.api_client.push_hourly_stats(
                    camera_id=self.config.camera_id,
                    hour=range_label,
                    in_count=record["IN"],
                    out_count=record["OUT"]
                )
            except Exception as e:
                self.logger.warning(f"Failed to push hourly stats (partial): {e}")

        peak = self.statistics.peak_hour()
        if peak is not None:
            self.logger.info(
                f"Peak hour: {peak['Hour']} "
                f"(IN={peak['IN']}, OUT={peak['OUT']}, TOTAL={peak['TOTAL']})"
            )