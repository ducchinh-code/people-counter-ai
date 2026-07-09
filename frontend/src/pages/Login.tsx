import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAxiosError } from "axios";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: Location })?.from?.pathname || "/";

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err) {
            const msg = isAxiosError(err)
                ? err.response?.data?.message
                : undefined;
            setError(msg || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            People Counter AI
    </h1>
    <p className="text-sm text-gray-500 mb-6">Đăng nhập để tiếp tục</p>

    <form onSubmit={handleSubmit} className="space-y-4">
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Tên đăng nhập
    </label>
    <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    required
    className="input"
    />
    </div>

    <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
        Mật khẩu
    </label>
    <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    className="input"
        />
        </div>

    {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
            </p>
    )}

    <button
        type="submit"
    disabled={loading}
    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        </form>
        </div>
        </div>
);
}