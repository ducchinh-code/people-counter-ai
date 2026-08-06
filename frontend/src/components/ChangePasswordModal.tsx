import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { changePassword } from "../api/auth";

interface ChangePasswordModalProps {
    onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới nhập lại không khớp.");
            return;
        }

        setSaving(true);
        try {
            await changePassword(oldPassword, newPassword);
            setSuccess(true);
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
                    Đổi mật khẩu
                </h2>

                {success ? (
                    <div className="space-y-4">
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            Đổi mật khẩu thành công.
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Mật khẩu hiện tại
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nhập lại mật khẩu mới
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                                required
                            />
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
                                {saving ? "Đang lưu..." : "Đổi mật khẩu"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}