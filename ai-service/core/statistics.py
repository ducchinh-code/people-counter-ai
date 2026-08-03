import os
from datetime import datetime, timedelta
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

RETENTION_DAYS = int(os.getenv("STATS_RETENTION_DAYS", "30"))


class Statistics:

    def __init__(self, csv_path=None):

        self.total_in = 0
        self.total_out = 0

        self._hour_start_in = 0
        self._hour_start_out = 0

        self._csv_path = Path("output") / csv_path if csv_path else None
        self.records = self._load_existing_records()

    def _load_existing_records(self):
        if self._csv_path and self._csv_path.exists():
            try:
                df = pd.read_csv(self._csv_path)
                records = df.to_dict("records")
                return self._prune_old_records(records)
            except Exception:
                return []
        return []

    def _prune_old_records(self, records):
        cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
        kept = []
        for r in records:
            hour_str = str(r.get("Hour", ""))
            record_date = self._parse_record_date(hour_str)
            if record_date is None or record_date >= cutoff:
                kept.append(r)
        return kept

    def _parse_record_date(self, hour_str):
        try:
            date_part = hour_str.split("-")[0].strip()
            date_part = date_part.replace(" (partial)", "")
            parsed = datetime.strptime(date_part, "%d/%m %H:%M")
            now = datetime.now()
            candidate = parsed.replace(year=now.year)
            if candidate > now + timedelta(days=1):
                candidate = candidate.replace(year=now.year - 1)
            return candidate
        except (ValueError, IndexError):
            return None

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

        self.records = self._prune_old_records(self.records)

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

    def save_csv(self, file_name="people_statistics.csv", df=None):
        Path("output").mkdir(exist_ok=True)
        (df if df is not None else self.get_dataframe()).to_csv(
            Path("output") / file_name,
            index=False
        )

    def peak_hour(self):
        df = self.get_dataframe()
        if df.empty:
            return None
        return df.loc[df["TOTAL"].idxmax()]

    def draw_chart(self, file_name="people_flow.png", df=None, max_hours=48):
        df = df if df is not None else self.get_dataframe()
        if df.empty:
            return

        df = df.tail(max_hours)  # chỉ hiển thị N giờ gần nhất, tránh biểu đồ quá dày đặc

        Path("output").mkdir(exist_ok=True)

        plt.figure(figsize=(14, 6))

        bars_in = plt.bar(df["Hour"], df["IN"], label="IN", color="steelblue", alpha=0.8)
        bars_out = plt.bar(df["Hour"], df["OUT"], bottom=df["IN"], label="OUT", color="tomato", alpha=0.8)

        is_partial = df["Hour"].astype(str).str.contains(r"\(partial\)", regex=True)

        for i, partial in enumerate(is_partial):
            if partial:
                bars_in[i].set_hatch("//")
                bars_in[i].set_alpha(0.35)
                bars_out[i].set_hatch("//")
                bars_out[i].set_alpha(0.35)

        plt.xlabel("Giờ")
        plt.ylabel("Số người")
        plt.title(
            f"Lưu lượng người ra/vào — {max_hours} giờ gần nhất\n"
            f"(cột gạch chéo = khoảng thời gian ngắn hơn 1 giờ)"
        )
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