import { useState } from "react";
import { getStreamUrl, updateCamera } from "../api/cameras";
import LiveStream from "./LiveStream";
import RegionEditor from "./RegionEditor";
import type { CameraResponse, CounterDataResponse } from "../types";

interface CameraZoomModalProps {
    camera: CameraResponse;
    snapshot?: CounterDataResponse;
    isLive: boolean;
    onClose: () => void;
    onCameraUpdated?: (updated: CameraResponse) => void;
}

export default function CameraZoomModal({
                                            camera,
                                            snapshot,
                                            isLive,
                                            onClose,
                                            onCameraUpdated,
                                        }: CameraZoomModalProps) {
    const inCount = snapshot?.inCount ?? 0;
    const outCount = snapshot?.outCount ?? 0;
    const total = snapshot?.total ?? 0;

    const [isEditingRegion, setIsEditingRegion] = useState(false);
    const [saving, setSaving] = useState(false);

    const videoWidth = 1920;
    const videoHeight = 1080;

    async function handleSaveRegion(newRegion: number[][]) {
        setSaving(true);
        try {
            const updated = await updateCamera(camera.id, {
                name: camera.name,
                source: camera.source,
                region: newRegion,
                tracker: camera.tracker,
                enabled: camera.enabled,
            });
            onCameraUpdated?.(updated);
            setIsEditingRegion(false);
        } catch (err) {
            alert("Lưu vùng đếm thất bại, thử lại nhé.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">{camera.name}</h2>
                    <div className="flex items-center gap-3">
                        {!isEditingRegion && camera.enabled && isLive && (
                            <button
                                onClick={() => setIsEditingRegion(true)}
                                className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                                Chỉnh vùng đếm
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                            aria-label="Đóng"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {isEditingRegion ? (
                        <RegionEditor
                            videoWidth={videoWidth}
                            videoHeight={videoHeight}
                            initialRegion={camera.region}
                            imageSrc={getStreamUrl(camera.id)}
                            onSave={handleSaveRegion}
                            onCancel={() => setIsEditingRegion(false)}
                            saving={saving}
                        />
                    ) : (
                        <>
                            <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg overflow-hidden">
                                {camera.enabled && isLive ? (
                                    <LiveStream
                                        key={camera.id}
                                        src={getStreamUrl(camera.id)}
                                        alt={camera.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-gray-500 text-sm px-4 text-center">
                                        {camera.enabled
                                            ? "Chưa nhận được dữ liệu từ ai-service"
                                            : "Camera đang tắt"}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-5">
                                <div className="bg-blue-50 rounded-lg py-4 text-center">
                                    <p className="text-2xl font-semibold text-blue-700">{inCount}</p>
                                    <p className="text-sm text-blue-500">Vào</p>
                                </div>
                                <div className="bg-orange-50 rounded-lg py-4 text-center">
                                    <p className="text-2xl font-semibold text-orange-700">{outCount}</p>
                                    <p className="text-sm text-orange-500">Ra</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg py-4 text-center">
                                    <p className="text-2xl font-semibold text-gray-700">{total}</p>
                                    <p className="text-sm text-gray-500">Tổng</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}