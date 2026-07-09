import { useEffect, useState } from "react";
import {
    getAllCameras,
    createCamera,
    updateCamera,
    toggleCamera,
    deleteCamera,
} from "../api/cameras";
import CameraFormModal from "../components/CameraFormModal";
import type { CameraResponse, CameraRequest } from "../types";

export default function CameraManagement() {
    const [cameras, setCameras] = useState<CameraResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState<CameraResponse | null>(null);

    async function load() {
        setLoading(true);
        try {
            setCameras(await getAllCameras());
        } catch {
            setError("Không tải được danh sách camera.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    function openCreate() {
        setEditingCamera(null);
        setModalOpen(true);
    }

    function openEdit(camera: CameraResponse) {
        setEditingCamera(camera);
        setModalOpen(true);
    }

    async function handleSubmit(payload: CameraRequest) {
        if (editingCamera) {
            await updateCamera(editingCamera.id, payload);
        } else {
            await createCamera(payload);
        }
        setModalOpen(false);
        await load();
    }

    async function handleToggle(camera: CameraResponse) {
        await toggleCamera(camera.id);
        await load();
    }

    async function handleDelete(camera: CameraResponse) {
        if (!confirm(`Xóa camera "${camera.name}"? Hành động không thể hoàn tác.`)) {
            return;
        }
        await deleteCamera(camera.id);
        await load();
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Quản lý Camera</h1>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    + Thêm camera
                </button>
            </div>

            {loading && <p className="text-gray-500">Đang tải...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Tên</th>
                            <th className="px-4 py-3">Nguồn</th>
                            <th className="px-4 py-3">Tracker</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {cameras.map((camera) => (
                            <tr key={camera.id}>
                                <td className="px-4 py-3 font-medium text-gray-800">
                                    {camera.name}
                                </td>
                                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                                    {camera.source}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{camera.tracker}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => void handleToggle(camera)}
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            camera.enabled
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {camera.enabled ? "Đang bật" : "Đang tắt"}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right space-x-3">
                                    <button
                                        onClick={() => openEdit(camera)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => void handleDelete(camera)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {cameras.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                                    Chưa có camera nào.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <CameraFormModal
                    camera={editingCamera}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}