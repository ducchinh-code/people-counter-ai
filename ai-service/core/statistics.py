from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


class Statistics:

    def __init__(self):

        self.total_in = 0
        self.total_out = 0

        self._hour_start_in = 0
        self._hour_start_out = 0

        self.records = []

    def update(self, in_count, out_count):

        self.total_in = in_count
        self.total_out = out_count

    def start_new_hour(self):

        self._hour_start_in = self.total_in
        self._hour_start_out = self.total_out

    def add_record(self, hour):

        delta_in = self.total_in - self._hour_start_in
        delta_out = self.total_out - self._hour_start_out

        self.records.append({
            "Hour": hour,
            "IN": delta_in,
            "OUT": delta_out,
            "TOTAL": delta_in + delta_out
        })

        self._hour_start_in = self.total_in
        self._hour_start_out = self.total_out

    @property
    def current_hour_in(self) -> int:
        return self.total_in - self._hour_start_in

    @property
    def current_hour_out(self) -> int:
        return self.total_out - self._hour_start_out

    def get_dataframe(self):

        return pd.DataFrame(self.records)

    def save_csv(self, file_name="people_statistics.csv"):

        Path("output").mkdir(exist_ok=True)

        self.get_dataframe().to_csv(
            Path("output") / file_name,
            index=False
        )

    def peak_hour(self):

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

        bars_in = plt.bar(
            df["Hour"],
            df["IN"],
            label="IN",
            color="steelblue",
            alpha=0.8
        )

        bars_out = plt.bar(
            df["Hour"],
            df["OUT"],
            bottom=df["IN"],
            label="OUT",
            color="tomato",
            alpha=0.8
        )

        is_partial = df["Hour"].str.contains(r"\(partial\)", regex=True)

        for i, partial in enumerate(is_partial):
            if partial:
                bars_in[i].set_hatch("//")
                bars_in[i].set_alpha(0.35)
                bars_out[i].set_hatch("//")
                bars_out[i].set_alpha(0.35)

        plt.xlabel("Giờ")
        plt.ylabel("Số người")
        plt.title("Lưu lượng người ra/vào theo từng giờ\n(cột gạch chéo = khoảng thời gian ngắn hơn 1 giờ)")
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