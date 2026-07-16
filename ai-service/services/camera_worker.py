
import os
import queue
import signal
import threading
import time
from datetime import datetime
from pathlib import Path

import cv2

from core.tracker import Tracker
from core.counter import Counter
from core.statistics import Statistics
from utils.logger import get_logger

HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
TARGET_PROCESS_FPS = int(os.getenv("TARGET_FPS", "10"))


class CameraWorker:

    def __init__(self, camera_config, detector, api_client=None):
        self.config = camera_config
        self.detector = detector
        self.api_client = api_client
        self.logger = get_logger(f"camera.{camera_config.camera_id}")

        self.cap = cv2.VideoCapture(camera_config.source)
        if not self.cap.isOpened():
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
        self._cumulative_in = 0
        self._cumulative_out = 0

        self._push_queue = queue.Queue(maxsize=2)
        self._last_snapshot_push = 0.0
        self.SNAPSHOT_PUSH_INTERVAL = 1.0

        self._fps_last_time = time.time()
        self._fps_smoothed = 0.0
        self._FPS_SMOOTHING = 0.9

        self.video_writer = None if HEADLESS else self._create_video_writer()

        signal.signal(signal.SIGTERM, self._handle_stop_signal)
        signal.signal(signal.SIGINT, self._handle_stop_signal)

    def _handle_stop_signal(self, signum, frame):
        self.logger.info(f"Received signal {signum} — sẽ dừng sau frame hiện tại")
        self._stop_requested = True

    def _reset_counter(self):
        self._cumulative_in += self.counter.in_count
        self._cumulative_out += self.counter.out_count
        self.counter = Counter(
            detector=self.detector,
            tracker=self.tracker,
            region=self.config.region
        )

    @property
    def total_in(self):
        return self._cumulative_in + self.counter.in_count

    @property
    def total_out(self):
        return self._cumulative_out + self.counter.out_count

    def _create_video_writer(self):
        Path("output").mkdir(exist_ok=True)
        fps = self.cap.get(cv2.CAP_PROP_FPS) or 25
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        return cv2.VideoWriter(
            str(Path("output") / self.video_file_name),
            fourcc, fps, (width, height)
        )

    def _push_worker(self):

        while not self._stop_requested:
            try:
                frame_bytes = self._push_queue.get(timeout=1)
                if self.api_client:
                    self.api_client.push_frame(self.config.camera_id, frame_bytes)
            except queue.Empty:
                continue
            except Exception as e:
                self.logger.warning(f"Push worker error: {e}")

    def run(self):
        self.logger.info(
            f"Started — source: {self.config.source} | "
            f"mode: {'headless' if HEADLESS else 'display'} | "
            f"target fps: {TARGET_PROCESS_FPS}"
        )

        if not HEADLESS:
            cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)

        if HEADLESS:
            push_thread = threading.Thread(target=self._push_worker, daemon=True)
            push_thread.start()

        self._start_label = datetime.now().strftime("%d/%m %H:%M")
        self._first_record = True
        self.current_hour = self._hour_key()
        self.statistics.start_new_hour()

        frame_interval = 1.0 / TARGET_PROCESS_FPS
        last_process_time = 0.0
        last_annotated = None

        fps_count = 0
        fps_start = time.time()

        while not self._stop_requested:

            success, frame = self.cap.read()

            if not success:
                self._read_fail_count += 1
                if self._read_fail_count > 1:
                    time.sleep(min(1.0, 0.1 * self._read_fail_count))
                self.loop_count += 1
                self.logger.debug(f"Video looped (#{self.loop_count})")
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                self._reset_counter()
                continue

            self._read_fail_count = 0

            now = time.time()
            instant_fps = 1.0 / max(now - self._fps_last_time, 1e-6)
            self._fps_smoothed = (
                    self._FPS_SMOOTHING * self._fps_smoothed
                    + (1 - self._FPS_SMOOTHING) * instant_fps
            )
            self._fps_last_time = now


            if now - last_process_time >= frame_interval:
                last_process_time = now

                results = self.counter.process(frame)
                last_annotated = results.plot_im

                fps_text = f"FPS: {self._fps_smoothed:.1f}"
                (text_w, text_h), _ = cv2.getTextSize(
                    fps_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2
                )

                overlay = last_annotated.copy()
                cv2.rectangle(
                    overlay,
                    (10, 10),
                    (10 + text_w + 20, 10 + text_h + 20),
                    (0, 0, 0),
                    -1
                )
                cv2.addWeighted(overlay, 0.5, last_annotated, 0.5, 0, last_annotated)

                cv2.putText(
                    last_annotated,
                    fps_text,
                    (20, 10 + text_h + 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (0, 255, 255),
                    2
                )

                self.statistics.update(self.total_in, self.total_out)
                self._record_if_new_hour()
                self._push_snapshot_if_due()



            if HEADLESS and last_annotated is not None:
                frame_to_push = self._encode_frame(last_annotated)
                if frame_to_push:
                    if self._push_queue.full():
                        try:
                            self._push_queue.get_nowait()
                        except queue.Empty:
                            pass
                    try:
                        self._push_queue.put_nowait(frame_to_push)
                    except queue.Full:
                        pass
            elif not HEADLESS and last_annotated is not None:
                self.video_writer.write(last_annotated)
                cv2.imshow(self.window_name, last_annotated)
                if cv2.waitKey(1) & 0xFF == 27:
                    self._stop_requested = True

        self._cleanup()

    def _encode_frame(self, frame):
        try:
            h, w = frame.shape[:2]
            if w > 960:
                scale = 960 / w
                frame = cv2.resize(frame, (960, int(h * scale)))
            _, jpeg = cv2.imencode(
                ".jpg", frame,
                [cv2.IMWRITE_JPEG_QUALITY, 70]
            )
            return jpeg.tobytes()
        except Exception as e:
            self.logger.warning(f"Encode frame error: {e}")
            return None

    def _push_snapshot_if_due(self):
        if self.api_client is None:
            return
        now = time.time()
        if now - self._last_snapshot_push < self.SNAPSHOT_PUSH_INTERVAL:
            return
        self._last_snapshot_push = now
        try:
            self.api_client.push_snapshot(
                camera_id=self.config.camera_id,
                current_in=self.statistics.current_hour_in,
                current_out=self.statistics.current_hour_out
            )
        except Exception as e:
            self.logger.warning(f"Failed to push snapshot: {e}")

    def _hour_key(self):
        return datetime.now().strftime("%d/%m %H:00")

    def _record_if_new_hour(self):
        hour_label = self._hour_key()
        if hour_label != self.current_hour:
            is_partial = self._first_record
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

            self._save_and_push_record(record, range_label, is_partial)
            self.current_hour = hour_label
            self.statistics.start_new_hour()

    def _cleanup(self):
        self.cap.release()
        if self.video_writer:
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
        self._save_and_push_record(record, range_label, is_partial=True)

        peak = self.statistics.peak_hour()
        if peak is not None:
            self.logger.info(
                f"Peak hour: {peak['Hour']} "
                f"(IN={peak['IN']}, OUT={peak['OUT']}, TOTAL={peak['TOTAL']})"
            )

    def _save_and_push_record(self, record, range_label, is_partial):
        if self.api_client:
            try:
                self.api_client.push_hourly_stats(
                    camera_id=self.config.camera_id,
                    hour=range_label,
                    in_count=record["IN"],
                    out_count=record["OUT"],
                    partial=is_partial
                )
            except Exception as e:
                self.logger.warning(f"Failed to push hourly stats: {e}")

        threading.Thread(
            target=self._save_local_files,
            daemon=True
        ).start()

    def _save_local_files(self):
        try:
            self.statistics.save_csv(self.csv_file_name)
            self.statistics.draw_chart(self.chart_file_name)
        except Exception as e:
            self.logger.warning(f"Failed to save CSV/chart: {e}")