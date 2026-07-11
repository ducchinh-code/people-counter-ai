import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import type { CameraResponse, CameraRequest } from "../types";
import * as React from "react";

interface CameraFormModalProps {
    camera: CameraResponse | null;
    onClose: () => void;
    onSubmit: (payload: CameraRequest) => Promise<void>;
}

interface FormState {
    name: string;
    source: string;
    tracker: string;
    enabled: boolean;
    regionText: string;
}

const emptyForm: FormState = {
    name: "",
    source: "",
    tracker: "botsort.yaml",
    enabled: true,
    regionText: "0,0 100,0",
};

export default function CameraFormModal({
                                            camera,
                                            onClose,
                                            onSubmit,
                                        }: CameraFormModalProps) {
    const [form, setForm] = useState<FormState>(() =>
        camera
            ? {
                name: camera.name,
                source: camera.source,
                tracker: camera.tracker,
                enabled: camera.enabled,
                regionText: camera.region.map((p) => p.join(",")).join(" "),
            }
            : emptyForm
    );
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function parseRegion(text: string): number[][] {
        const points = text
            .trim()
            .split(/\s+/)
            .map((pair) => pair.split(",").map((n) => parseInt(n.trim(), 10)));

        const valid =
            points.length >= 2 &&
            points.every((p) => p.length === 2 && p.every((n) => !isNaN(n)));

        if (!valid) {
            throw new Error(
                "Vùng đếm (region) không hợp lệ. Nhập ít nhất 2 điểm, ví dụ: 0,0 100,0"
            );
        }
        return points;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            const region = parseRegion(form.regionText);
            await onSubmit({
                name: form.name,
                source: form.source,
                tracker: form.tracker,
                enabled: form.enabled,
                region,
            });
        } catch (err) {
            const msg = isAxiosError(err)
                ? err.response?.data?.message
                : err instanceof Error
                    ? err.message
                    : undefined;
            setError(msg || "Có lỗi xảy ra.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {camera ? "Sửa Camera" : "Thêm Camera"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <Field label="Tên camera">
                        <input
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Nguồn — đường dẫn video / URL RTSP">
                        <input
                            className="input"
                            value={form.source}
                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Tracker">
                        <select
                            className="input"
                            value={form.tracker}
                            onChange={(e) => setForm({ ...form, tracker: e.target.value })}
                        >
                            <option value="botsort.yaml">botsort.yaml</option>
                            <option value="bytetrack.yaml">bytetrack.yaml</option>
                        </select>
                    </Field>

                    <Field label="Vùng đếm — các điểm x,y cách nhau bởi dấu cách">
                        <input
                            className="input font-mono"
                            value={form.regionText}
                            onChange={(e) => setForm({ ...form, regionText: e.target.value })}
                            placeholder="811,1171 1824,1178"
                            required
                        />
                    </Field>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.enabled}
                            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                        />
                        Kích hoạt camera
                    </label>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium"
                        >
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}