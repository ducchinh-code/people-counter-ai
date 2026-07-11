import { getStreamUrl } from "../api/cameras";
import { useNow } from "../hooks/useNow";
import { isSnapshotLive } from "../utils/liveStatus";
import type { CameraResponse, CounterDataResponse } from "../types";

interface CameraCardProps {
    camera: CameraResponse;
    snapshot?: CounterDataResponse;
    onClick?: () => void;
}

const STALE_THRESHOLD_MS = 10_000;

export default function CameraCard({ camera, snapshot, onClick }: CameraCardProps) {
    const now = useNow(2000);

    const inCount = snapshot?.inCount ?? 0;
    const outCount = snapshot?.outCount ?? 0;
    const total = snapshot?.total ?? 0;
    const recordedAt = snapshot ? new Date(snapshot.recordedAt).getTime() : null;
    const isLive = isSnapshotLive(snapshot);

    console.log("camera", camera.id, "raw:", snapshot?.recordedAt, "parsed:", recordedAt, "isLive:", recordedAt !== null && now - recordedAt < STALE_THRESHOLD_MS);


    const status: { label: string; className: string } = !camera.enabled
        ? { label: "Đã tắt", className: "bg-gray-100 text-gray-500" }
        : isLive
            ? { label: "● Đang hoạt động", className: "bg-green-100 text-green-700" }
            : { label: "● Mất kết nối", className: "bg-red-100 text-red-600" };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {camera.enabled && isLive ? (
                    <img
                        key={camera.id}
                        src={getStreamUrl(camera.id)}
                        alt={camera.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <span className="text-gray-500 text-sm px-4 text-center">
            {camera.enabled
                ? "Chưa nhận được dữ liệu từ ai-service"
                : "Camera đang tắt"}
          </span>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{camera.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg py-2">
                        <p className="text-lg font-semibold text-blue-700">{inCount}</p>
                        <p className="text-xs text-blue-500">Vào</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg py-2">
                        <p className="text-lg font-semibold text-orange-700">{outCount}</p>
                        <p className="text-xs text-orange-500">Ra</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-lg font-semibold text-gray-700">{total}</p>
                        <p className="text-xs text-gray-500">Tổng</p>
                    </div>
                </div>
            </div>
        </div>
    );
}