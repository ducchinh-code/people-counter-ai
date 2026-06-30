from datetime import datetime
from pathlib import Path

import cv2

from core.tracker import Tracker
from core.counter import Counter
from core.statistics import Statistics


class CameraWorker:

    def __init__(self, camera_config, detector):

        self.config = camera_config
        self.detector = detector

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

        # File output riêng cho từng camera, tránh ghi đè lẫn nhau
        self.csv_file_name = f"people_statistics_cam{camera_config.camera_id}.csv"
        self.chart_file_name = f"people_flow_cam{camera_config.camera_id}.png"
        self.video_file_name = f"people_video_cam{camera_config.camera_id}.mp4"

        # Theo dõi mốc giờ hiện tại để biết khi nào sang giờ mới
        self.current_hour = None

        self.video_writer = self._create_video_writer()

    def _create_video_writer(self):

        Path("output").mkdir(exist_ok=True)

        fps = self.cap.get(cv2.CAP_PROP_FPS)

        # Một số video không trả về FPS hợp lệ (0 hoặc NaN) -> dùng giá trị mặc định
        if not fps or fps <= 0:
            fps = 25

        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        output_path = str(Path("output") / self.video_file_name)

        return cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    def run(self):

        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)

        while self.cap.isOpened():

            success, frame = self.cap.read()

            if not success:
                break

            results = self.counter.process(frame)

            self.statistics.update(
                self.counter.in_count,
                self.counter.out_count
            )

            self._record_if_new_hour()

            self.video_writer.write(results.plot_im)

            cv2.imshow(
                self.window_name,
                results.plot_im
            )

            if cv2.waitKey(1) & 0xFF == 27:
                break

        self.cap.release()
        self.video_writer.release()

        self._finalize_statistics()

        print(f"{self.window_name} stopped.")

    def _record_if_new_hour(self):
        """
        Ghi nhận 1 record thống kê mỗi khi sang giờ mới (theo giờ thực của hệ thống).
        """

        hour_label = datetime.now().strftime("%H:00")

        if hour_label != self.current_hour:

            self.current_hour = hour_label

            self.statistics.add_record(hour_label)

    def _finalize_statistics(self):
        """
        Lưu lại record cuối cùng (số liệu tại thời điểm dừng) và xuất CSV + biểu đồ.
        """

        # Đảm bảo luôn có ít nhất 1 record, kể cả khi video kết thúc
        # trước khi sang giờ mới.
        self._record_if_new_hour()

        self.statistics.save_csv(self.csv_file_name)
        self.statistics.draw_chart(self.chart_file_name)

        peak = self.statistics.peak_hour()

        if peak is not None:
            print(
                f"[{self.window_name}] Peak hour: {peak['Hour']} "
                f"(IN={peak['IN']}, OUT={peak['OUT']}, TOTAL={peak['TOTAL']})"
            )

        print(
            f"[{self.window_name}] Saved: "
            f"output/{self.csv_file_name}, "
            f"output/{self.chart_file_name}, "
            f"output/{self.video_file_name}"
        )