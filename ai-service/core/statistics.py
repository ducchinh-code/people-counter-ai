from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


class Statistics:

    def __init__(self):

        # Số tích lũy hiện tại (cập nhật liên tục từ counter)
        self.total_in = 0
        self.total_out = 0

        # Số tích lũy tại đầu giờ hiện tại (để tính delta)
        self._hour_start_in = 0
        self._hour_start_out = 0

        self.records = []

    def update(self, in_count, out_count):
        """
        Cập nhật số tích lũy hiện tại từ counter.
        """

        self.total_in = in_count
        self.total_out = out_count

    def start_new_hour(self):
        """
        Đánh dấu mốc đầu giờ mới — lưu lại giá trị tích lũy hiện tại
        làm baseline để tính delta cho giờ tiếp theo.
        Gọi hàm này khi bắt đầu mỗi giờ mới.
        """

        self._hour_start_in = self.total_in
        self._hour_start_out = self.total_out

    def add_record(self, hour):
        """
        Lưu số người ra/vào TRONG giờ vừa kết thúc (delta so với đầu giờ),
        không phải số tích lũy toàn bộ.
        """

        delta_in = self.total_in - self._hour_start_in
        delta_out = self.total_out - self._hour_start_out

        self.records.append({
            "Hour": hour,
            "IN": delta_in,
            "OUT": delta_out,
            "TOTAL": delta_in + delta_out
        })

        # Cập nhật baseline cho giờ tiếp theo
        self._hour_start_in = self.total_in
        self._hour_start_out = self.total_out

    def get_dataframe(self):

        return pd.DataFrame(self.records)

    def save_csv(self, file_name="people_statistics.csv"):

        Path("output").mkdir(exist_ok=True)

        self.get_dataframe().to_csv(
            Path("output") / file_name,
            index=False
        )

    def peak_hour(self):
        """
        Trả về giờ có nhiều người ra/vào nhất trong ngày.
        """

        df = self.get_dataframe()

        if df.empty:
            return None

        return df.loc[df["TOTAL"].idxmax()]

    def draw_chart(self, file_name="people_flow.png"):

        df = self.get_dataframe()

        if df.empty:
            return

        Path("output").mkdir(exist_ok=True)

        plt.figure(figsize=(14, 6))

        plt.bar(
            df["Hour"],
            df["IN"],
            label="IN",
            color="steelblue",
            alpha=0.8
        )

        plt.bar(
            df["Hour"],
            df["OUT"],
            bottom=df["IN"],
            label="OUT",
            color="tomato",
            alpha=0.8
        )

        plt.xlabel("Giờ")
        plt.ylabel("Số người")
        plt.title("Lưu lượng người ra/vào theo từng giờ")
        plt.legend()
        plt.xticks(rotation=45)
        plt.grid(axis="y")
        plt.tight_layout()

        plt.savefig(Path("output") / file_name)
        plt.close()

    def reset(self):

        self.total_in = 0
        self.total_out = 0
        self._hour_start_in = 0
        self._hour_start_out = 0
        self.records.clear()