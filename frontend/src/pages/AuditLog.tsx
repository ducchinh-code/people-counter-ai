import { useEffect, useState } from "react";
import { getAuditLogs, type AuditLogEntry } from "../api/auditLogs";

const ACTION_LABELS: Record<string, string> = {
    LOGIN_SUCCESS: "Đăng nhập thành công",
    LOGIN_FAILED: "Đăng nhập thất bại",
    REGISTER_USER: "Tạo user mới",
    CHANGE_PASSWORD: "Tự đổi mật khẩu",
    RESET_PASSWORD: "Admin reset mật khẩu",
    UPDATE_ROLE: "Đổi quyền",
    TOGGLE_USER: "Bật/tắt user",
    DELETE_USER: "Xoá user",
    CREATE_CAMERA: "Tạo camera",
    UPDATE_CAMERA: "Sửa camera",
    DELETE_CAMERA: "Xoá camera",
    TOGGLE_CAMERA: "Bật/tắt camera",
    BULK_CREATE_CAMERA: "Tạo camera hàng loạt",
};

const ACTION_COLOR: Record<string, string> = {
    LOGIN_FAILED: "bg-red-100 text-red-700",
    DELETE_USER: "bg-red-100 text-red-700",
    DELETE_CAMERA: "bg-red-100 text-red-700",
    RESET_PASSWORD: "bg-amber-100 text-amber-700",
    UPDATE_ROLE: "bg-amber-100 text-amber-700",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN");
}

export default function AuditLog() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [usernameFilter, setUsernameFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    async function load(pageToLoad: number) {
        setLoading(true);
        setError("");
        try {
            const result = await getAuditLogs({
                username: usernameFilter || undefined,
                action: actionFilter || undefined,
                page: pageToLoad,
                size: 30,
            });
            setEntries(result.content);
            setTotalPages(result.totalPages);
            setPage(result.page);
        } catch {
            setError("Không tải được nhật ký hoạt động.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleFilter(e: React.FormEvent) {
        e.preventDefault();
        void load(0);
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold text-gray-800">Nhật ký hoạt động</h1>

            <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Username
                    </label>
                    <input
                        className="input"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        placeholder="Tất cả"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Hành động
                    </label>
                    <select
                        className="input"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        {Object.entries(ACTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                    Lọc
                </button>
            </form>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">Thời gian</th>
                        <th className="px-4 py-3 text-left">Người dùng</th>
                        <th className="px-4 py-3 text-left">Hành động</th>
                        <th className="px-4 py-3 text-left">Đối tượng</th>
                        <th className="px-4 py-3 text-left">Chi tiết</th>
                        <th className="px-4 py-3 text-left">IP</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                Đang tải...
                            </td>
                        </tr>
                    ) : entries.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                Không có bản ghi nào.
                            </td>
                        </tr>
                    ) : (
                        entries.map((entry) => (
                            <tr key={entry.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                    {formatDate(entry.createdAt)}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-800">
                                    {entry.username}
                                </td>
                                <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                ACTION_COLOR[entry.action] ??
                                                "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {ACTION_LABELS[entry.action] ?? entry.action}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {entry.targetType
                                        ? `${entry.targetType} #${entry.targetId}`
                                        : "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {entry.detail ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-400">
                                    {entry.ipAddress ?? "—"}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => void load(page - 1)}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-gray-500">
                        Trang {page + 1}/{totalPages}
                    </span>
                    <button
                        onClick={() => void load(page + 1)}
                        disabled={page + 1 >= totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}