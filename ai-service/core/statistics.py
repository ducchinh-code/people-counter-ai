from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


class Statistics:

    def __init__(self):

        self.total_in = 0
        self.total_out = 0

        self.records = []

    def update(self, in_count, out_count):
        """
        Cập nhật số lượng hiện tại.
        """

        self.total_in = in_count
        self.total_out = out_count

    def add_record(self, hour):
        """
        Lưu thống kê theo từng khoảng thời gian.
        """

        self.records.append({
            "Hour": hour,
            "IN": self.total_in,
            "OUT": self.total_out,
            "TOTAL": self.total_in + self.total_out
        })

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

        plt.plot(
            df["Hour"],
            df["TOTAL"],
            marker="o",
            linewidth=2
        )

        plt.xlabel("Hour")
        plt.ylabel("People")

        plt.title("People Flow")

        plt.xticks(rotation=45)

        plt.grid(True)

        plt.tight_layout()

        plt.savefig(Path("output") / file_name)

        plt.close()

    def reset(self):

        self.total_in = 0
        self.total_out = 0
        self.records.clear()