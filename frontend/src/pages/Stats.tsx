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
import { getStatsByCamera, getStatsByCameraRange } from "../api/stats";
import { getAllCameras } from "../api/cameras";
import type { StatisticsResponse, CameraResponse } from "../types";

type ViewMode = "day" | "week" | "month";


function formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function todayStr(): string {
    return formatLocalDate(new Date());
}

function parseLocalDate(dateStr: string): Date {
    return new Date(dateStr + "T00:00:00");
}

function weekStart(dateStr: string): Date {
    const d = parseLocalDate(dateStr);
    const dayOfWeek = d.getDay(); // 0 = CN, 1 = T2, ... 6 = T7
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - diffToMonday);
    return d;
}

function monthRange(dateStr: string): { from: Date; to: Date } {
    const d = parseLocalDate(dateStr);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from, to };
}

function shiftDate(dateStr: string, mode: ViewMode, direction: 1 | -1): string {
    const d = parseLocalDate(dateStr);
    if (mode === "day") d.setDate(d.getDate() + direction);
    else if (mode === "week") d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    return formatLocalDate(d);
}

function formatDayLabel(d: Date): string {
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function rangeLabel(mode: ViewMode, dateStr: string): string {
    const d = parseLocalDate(dateStr);
    if (mode === "day") {
        return d.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }
    if (mode === "week") {
        const start = weekStart(dateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${formatDayLabel(start)} - ${formatDayLabel(end)}/${end.getFullYear()}`;
    }
    const { from } = monthRange(dateStr);
    return `Tháng ${from.getMonth() + 1}/${from.getFullYear()}`;
}

const viewModeLabels: Record<ViewMode, string> = {
    day: "Ngày",
    week: "Tuần",
    month: "Tháng",
};

export default function Stats() {
    const [viewMode, setViewMode] = useState<ViewMode>("day");
    const [date, setDate] = useState(todayStr());

    const [cameras, setCameras] = useState<CameraResponse[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);

    const [dayStats, setDayStats] = useState<StatisticsResponse | null>(null);
    const [rangeStats, setRangeStats] = useState<StatisticsResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCameras() {
            try {
                const data = await getAllCameras();
                setCameras(data);
                if (data.length > 0) setSelectedCameraId(data[0].id);
            } catch {
                setError("Không tải được danh sách camera.");
            }
        }
        void loadCameras();
    }, []);

    useEffect(() => {
        if (selectedCameraId === null) return;

        async function load() {
            setLoading(true);
            setError("");
            try {
                if (viewMode === "day") {
                    const data = await getStatsByCamera(selectedCameraId!, date);
                    setDayStats(data);
                    setRangeStats([]);
                } else {
                    const { from, to } =
                        viewMode === "week"
                            ? (() => {
                                const start = weekStart(date);
                                const end = new Date(start);
                                end.setDate(end.getDate() + 6);
                                return { from: start, to: end };
                            })()
                            : monthRange(date);

                    const data = await getStatsByCameraRange(
                        selectedCameraId!,
                        formatLocalDate(from),
                        formatLocalDate(to)
                    );
                    setRangeStats(data);
                    setDayStats(null);
                }
            } catch {
                setError("Không tải được thống kê.");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [selectedCameraId, date, viewMode]);

    function handleModeChange(mode: ViewMode) {
        setViewMode(mode);
    }

    const rangeChartData = rangeStats.map((s) => ({
        label: s.date, // dd/MM/yyyy từ backend
        inCount: s.totalIn,
        outCount: s.totalOut,
        total: s.totalPeople,
    }));

    const rangeTotalIn = rangeStats.reduce((sum, s) => sum + s.totalIn, 0);
    const rangeTotalOut = rangeStats.reduce((sum, s) => sum + s.totalOut, 0);
    const rangeTotalPeople = rangeTotalIn + rangeTotalOut;
    const peakDay = rangeStats.reduce<StatisticsResponse | null>((peak, s) => {
        if (!peak || s.totalPeople > peak.totalPeople) return s;
        return peak;
    }, null);

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h1 className="text-xl font-semibold text-gray-800">
                    Thống kê lưu lượng người
                </h1>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                        {(Object.keys(viewModeLabels) as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => handleModeChange(mode)}
                                className={`px-3 py-1.5 text-sm font-medium transition ${
                                    viewMode === mode
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {viewModeLabels[mode]}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setDate((d) => shiftDate(d, viewMode, -1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                            aria-label="Trước"
                        >
                            &#8592;
                        </button>
                        <span className="text-sm text-gray-700 min-w-40 text-center px-1">
              {rangeLabel(viewMode, date)}
            </span>
                        <button
                            onClick={() => setDate((d) => shiftDate(d, viewMode, 1))}
                            disabled={date >= todayStr()}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Sau"
                        >
                            &#8594;
                        </button>
                        {date < todayStr() && (
                            <button
                                onClick={() => setDate(todayStr())}
                                className="ml-1 text-sm text-blue-600 hover:underline px-2"
                            >
                                Hôm nay
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {cameras.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                    {cameras.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCameraId(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                c.id === selectedCameraId
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {loading && <p className="text-gray-500">Đang tải...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {/* ===== Chế độ NGÀY — biểu đồ theo giờ (giữ nguyên như trước) ===== */}
            {!loading && !error && viewMode === "day" && dayStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <SummaryBox label="Tổng vào" value={dayStats.totalIn} color="blue" />
                        <SummaryBox label="Tổng ra" value={dayStats.totalOut} color="orange" />
                        <SummaryBox label="Tổng lượt" value={dayStats.totalPeople} color="gray" />
                        <SummaryBox
                            label={`Giờ cao điểm (${dayStats.peakHour || "--"})`}
                            value={dayStats.peakTotal}
                            color="purple"
                        />
                    </div>

                    {dayStats.hourlyData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            Không có dữ liệu cho ngày này.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={dayStats.hourlyData} margin={{ bottom: 70 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="inCount" name="Vào" fill="#2563eb" stackId="a" />
                                <Bar dataKey="outCount" name="Ra" fill="#f97316" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {!loading && !error && viewMode !== "day" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <SummaryBox label="Tổng vào" value={rangeTotalIn} color="blue" />
                        <SummaryBox label="Tổng ra" value={rangeTotalOut} color="orange" />
                        <SummaryBox label="Tổng lượt" value={rangeTotalPeople} color="gray" />
                        <SummaryBox
                            label={`Ngày cao điểm (${peakDay?.date || "--"})`}
                            value={peakDay?.totalPeople ?? 0}
                            color="purple"
                        />
                    </div>

                    {rangeChartData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            Không có dữ liệu cho khoảng thời gian này.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={rangeChartData} margin={{ bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    angle={viewMode === "month" ? -45 : 0}
                                    textAnchor={viewMode === "month" ? "end" : "middle"}
                                    height={viewMode === "month" ? 70 : 30}
                                    interval={viewMode === "month" ? 1 : 0}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="inCount" name="Vào" fill="#2563eb" stackId="a" />
                                <Bar dataKey="outCount" name="Ra" fill="#f97316" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
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