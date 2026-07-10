import { useEffect, useState } from "react";
import {
    getAllUsers,
    createUser,
    toggleUser,
    updateUserRole,
    deleteUser,
} from "../api/users";
import UserFormModal from "../components/UserFormModal";
import { useAuth } from "../context/AuthContext";
import type { UserResponse, Role } from "../types";

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [actionError, setActionError] = useState("");

    async function load() {
        setLoading(true);
        try {
            setUsers(await getAllUsers());
        } catch {
            setError("Không tải được danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleCreate(payload: { username: string; password: string; role: Role }) {
        await createUser(payload);
        setModalOpen(false);
        await load();
    }

    async function handleToggle(u: UserResponse) {
        setActionError("");
        try {
            await toggleUser(u.id);
            await load();
        } catch (err) {
            setActionError(extractError(err));
        }
    }

    async function handleRoleChange(u: UserResponse, role: Role) {
        setActionError("");
        try {
            await updateUserRole(u.id, role);
            await load();
        } catch (err) {
            setActionError(extractError(err));
        }
    }

    async function handleDelete(u: UserResponse) {
        if (!confirm(`Xóa người dùng "${u.username}"? Hành động không thể hoàn tác.`)) {
            return;
        }
        setActionError("");
        try {
            await deleteUser(u.id);
            await load();
        } catch (err) {
            setActionError(extractError(err));
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Quản lý người dùng</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    + Thêm người dùng
                </button>
            </div>

            {loading && <p className="text-gray-500">Đang tải...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {actionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {actionError}
                </p>
            )}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Tên đăng nhập</th>
                            <th className="px-4 py-3">Vai trò</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {users.map((u) => {
                            const isSelf = u.username === currentUser?.username;
                            return (
                                <tr key={u.id}>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {u.username}
                                        {isSelf && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          bạn
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={u.role}
                                            disabled={isSelf}
                                            onChange={(e) => void handleRoleChange(u, e.target.value as Role)}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => void handleToggle(u)}
                                            disabled={isSelf}
                                            className={`text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                                u.enabled
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {u.enabled ? "Đang bật" : "Đang tắt"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => void handleDelete(u)}
                                            disabled={isSelf}
                                            className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                                    Chưa có người dùng nào.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <UserFormModal onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
            )}
        </div>
    );
}

function extractError(err: unknown): string {
    if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        return response?.data?.message || "Có lỗi xảy ra.";
    }
    return "Có lỗi xảy ra.";
}