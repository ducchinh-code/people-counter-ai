import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { login as loginApi } from "../api/auth";
import { getTokenExpiryMs } from "../utils/jwt";
import type { CurrentUser, AuthResponse } from "../types";

interface AuthContextValue {
    user: CurrentUser | null;
    isAdmin: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<AuthResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EXPIRY_CHECK_INTERVAL_MS = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(() => {
        const saved = localStorage.getItem("user");
        return saved ? (JSON.parse(saved) as CurrentUser) : null;
    });
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<number | null>(null);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    function startExpiryWatcher() {
        stopExpiryWatcher();

        intervalRef.current = window.setInterval(() => {
            const token = localStorage.getItem("token");
            if (!token) {
                stopExpiryWatcher();
                return;
            }

            const expiryMs = getTokenExpiryMs(token);
            // Không đọc được exp thì bỏ qua (không tự logout để tránh false positive).
            if (expiryMs !== null && Date.now() >= expiryMs) {
                logout();
            }
        }, EXPIRY_CHECK_INTERVAL_MS);
    }

    function stopExpiryWatcher() {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    async function login(username: string, password: string): Promise<AuthResponse> {
        setLoading(true);
        try {
            const data = await loginApi(username, password);
            localStorage.setItem("token", data.token);
            const currentUser: CurrentUser = { username: data.username, role: data.role };
            localStorage.setItem("user", JSON.stringify(currentUser));
            setUser(currentUser);
            startExpiryWatcher();
            return data;
        } finally {
            setLoading(false);
        }
    }

    // Lúc app mới mount (F5, mở tab mới): nếu đã có token cũ, kiểm tra ngay —
    // có thể nó đã hết hạn từ lâu trong lúc trình duyệt đóng.
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const expiryMs = getTokenExpiryMs(token);
            if (expiryMs !== null && Date.now() >= expiryMs) {
                logout();
            } else {
                startExpiryWatcher();
            }
        }
        return () => stopExpiryWatcher();
    }, []);

    useEffect(() => {
        function handleStorage(e: StorageEvent) {
            if (e.key === "token" && !e.newValue) {
                setUser(null);
                stopExpiryWatcher();
            }
        }
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const isAdmin = user?.role === "ADMIN";

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth phải dùng bên trong <AuthProvider>");
    return ctx;
}