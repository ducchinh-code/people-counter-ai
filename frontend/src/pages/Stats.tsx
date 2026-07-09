import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { getAllStats } from "../api/stats";
import type { StatisticsResponse } from "../types";

function todayStr(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function Stats() {
    const [date, setDate] = useState(todayStr());
    const [statsList, setStatsList] = useState<StatisticsResponse[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError("");
            try {
                const data = await getAllStats(date);
                setStatsList(data);
                if (data.length > 0) {
                    setSelectedCameraId((prev) =>
                        data.some((s) => s.cameraId === prev) ? prev : data[0].cameraId
                    );
                }
            } catch {
                setError("Không tải được thống kê.");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [date]);

    const selected = statsList.find((s) => s.cameraId === selectedCameraId);

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h1 className="text-xl font-semibold text-gray-800">
                    Thống kê lưu lượng người
                </h1>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
            </div>

            {loading && <p className="text-gray-500">Đang tải...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && statsList.length === 0 && (
                <p className="text-gray-500">Không có dữ liệu cho ngày này.</p>
            )}

            {!loading && statsList.length > 0 && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {statsList.map((s) => (
                            <button
                                key={s.cameraId}
                                onClick={() => setSelectedCameraId(s.cameraId)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    s.cameraId === selectedCameraId
                                        ? "bg-blue-600 text-white"
                                        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {s.cameraName}
                            </button>
                        ))}
                    </div>

                    {selected && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <SummaryBox label="Tổng vào" value={selected.totalIn} color="blue" />
                                <SummaryBox label="Tổng ra" value={selected.totalOut} color="orange" />
                                <SummaryBox label="Tổng lượt" value={selected.totalPeople} color="gray" />
                                <SummaryBox
                                    label={`Giờ cao điểm (${selected.peakHour || "--"})`}
                                    value={selected.peakTotal}
                                    color="purple"
                                />
                            </div>

                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={selected.hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="hour"
                                        tick={{ fontSize: 11 }}
                                        angle={-30}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="inCount" name="Vào" fill="#2563eb" stackId="a" />
                                    <Bar dataKey="outCount" name="Ra" fill="#f97316" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface SummaryBoxProps {
    label: string;
    value: number;
    color: "blue" | "orange" | "gray" | "purple";
}

function SummaryBox({ label, value, color }: SummaryBoxProps) {
    const colorMap: Record<SummaryBoxProps["color"], string> = {
        blue: "bg-blue-50 text-blue-700",
        orange: "bg-orange-50 text-orange-700",
        gray: "bg-gray-50 text-gray-700",
        purple: "bg-purple-50 text-purple-700",
    };
    return (
        <div className={`rounded-lg py-3 px-3 text-center ${colorMap[color]}`}>
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs mt-0.5">{label}</p>
        </div>
    );
}