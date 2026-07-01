import os
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

        # Chỉ tạo VideoWriter khi không phải HEADLESS
        # (production stream frame lên backend, không ghi file)
        self.video_writer = None if HEADLESS else self._create_video_writer()

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

        self.current_hour = datetime.now().strftime("%H:00")
        self.statistics.start_new_hour()

        while True:

            success, frame = self.cap.read()

            if not success:
                self.loop_count += 1
                self.logger.debug(f"Video looped (#{self.loop_count})")
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

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
                    break

        self._cleanup()

    def _push_frame(self, frame):
        """
        Encode frame thành JPEG và push lên backend.
        Chỉ chạy trong HEADLESS mode.
        """

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

    def _record_if_new_hour(self):

        hour_label = datetime.now().strftime("%H:00")

        if hour_label != self.current_hour:

            range_label = f"{self.current_hour}-{hour_label}"

            self.statistics.add_record(range_label)

            record = self.statistics.records[-1]

            self.logger.info(
                f"Hour recorded [{range_label}] — "
                f"IN={record['IN']}, OUT={record['OUT']}, TOTAL={record['TOTAL']}"
            )

            # Ghi CSV và chart ngay — không chờ đến khi dừng
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
        """
        Ghi lại phần cuối chưa đủ 1 giờ khi bị dừng đột ngột.
        """

        now_label = datetime.now().strftime("%H:%M")
        range_label = f"{self.current_hour}-{now_label} (partial)"

        self.statistics.add_record(range_label)
        self.statistics.save_csv(self.csv_file_name)
        self.statistics.draw_chart(self.chart_file_name)

        peak = self.statistics.peak_hour()
        if peak is not None:
            self.logger.info(
                f"Peak hour: {peak['Hour']} "
                f"(IN={peak['IN']}, OUT={peak['OUT']}, TOTAL={peak['TOTAL']})"
            )