import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import type { Role } from "../types";

interface UserFormModalProps {
    onClose: () => void;
    onSubmit: (payload: { username: string; password: string; role: Role }) => Promise<void>;
}

export default function UserFormModal({ onClose, onSubmit }: UserFormModalProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("USER");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await onSubmit({ username, password, role });
        } catch (err) {
            const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(msg || "Có lỗi xảy ra.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Thêm người dùng
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tên đăng nhập
                        </label>
                        <input
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={50}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Vai trò
                        </label>
                        <select
                            className="input"
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                        >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

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
                            {saving ? "Đang lưu..." : "Tạo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}