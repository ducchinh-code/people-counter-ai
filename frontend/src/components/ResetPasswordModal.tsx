import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

interface ResetPasswordModalProps {
    username: string;
    onClose: () => void;
    onSubmit: (newPassword: string) => Promise<void>;
}

export default function ResetPasswordModal({
                                               username,
                                               onClose,
                                               onSubmit,
                                           }: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp.");
            return;
        }

        setSaving(true);
        try {
            await onSubmit(newPassword);
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
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Reset mật khẩu
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Cho tài khoản <span className="font-medium">{username}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
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
                            autoFocus
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
                            {saving ? "Đang lưu..." : "Reset mật khẩu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}