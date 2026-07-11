import { useEffect, useState } from "react";
import { getAllCameras } from "../api/cameras";
import { getAllSnapshots } from "../api/counter";
import { useSnapshotSocket } from "../hooks/useSnapshotSocket";
import CameraCard from "../components/CameraCard";
import CameraZoomModal from "../components/CameraZoomModal";
import type { CameraResponse, CounterDataResponse } from "../types";
import { isSnapshotLive } from "../utils/liveStatus";

interface SnapshotMap {
    [cameraId: number]: CounterDataResponse;
}

export default function Dashboard() {
    const [cameras, setCameras] = useState<CameraResponse[]>([]);
    const [initialSnapshots, setInitialSnapshots] = useState<SnapshotMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [zoomedCamera, setZoomedCamera] = useState<CameraResponse | null>(null);

    const { snapshots: liveSnapshots, connected } = useSnapshotSocket();

    useEffect(() => {
        async function load() {
            try {
                const [camerasData, snapshotsData] = await Promise.all([
                    getAllCameras(),
                    getAllSnapshots(),
                ]);
                setCameras(camerasData);

                const map: SnapshotMap = {};
                snapshotsData.forEach((s) => {
                    map[s.cameraId] = s;
                });
                setInitialSnapshots(map);
            } catch {
                setError("Không tải được danh sách camera. Kiểm tra backend đã chạy chưa.");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    if (loading) {
        return <p className="text-gray-500">Đang tải dữ liệu...</p>;
    }

    if (error) {
        return (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 inline-block">
                {error}
            </p>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Tổng quan Camera</h1>
                <span
                    className={`text-xs px-2 py-1 rounded-full ${
                        connected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                >
          {connected ? "● Realtime đang kết nối" : "○ Đang kết nối lại..."}
        </span>
            </div>

            {cameras.length === 0 ? (
                <p className="text-gray-500">Chưa có camera nào được cấu hình.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cameras.map((camera) => (
                        <CameraCard
                            key={camera.id}
                            camera={camera}
                            snapshot={liveSnapshots[camera.id] || initialSnapshots[camera.id]}
                            onClick={() => setZoomedCamera(camera)}
                        />
                    ))}
                </div>
            )}
            {zoomedCamera && (
                <CameraZoomModal
                    camera={zoomedCamera}
                    snapshot={liveSnapshots[zoomedCamera.id] || initialSnapshots[zoomedCamera.id]}
                    isLive={isSnapshotLive(liveSnapshots[zoomedCamera.id] || initialSnapshots[zoomedCamera.id])}
                    onClose={() => setZoomedCamera(null)}
                />
            )}
        </div>
    );
}