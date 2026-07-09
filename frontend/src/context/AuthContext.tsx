import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { login as loginApi } from "../api/auth";
import type { CurrentUser, AuthResponse } from "../types";

interface AuthContextValue {
    user: CurrentUser | null;
    isAdmin: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<AuthResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

    const [user, setUser] = useState<CurrentUser | null>(() => {
        const saved = localStorage.getItem("user");
        return saved ? (JSON.parse(saved) as CurrentUser) : null;
    });
    const [loading, setLoading] = useState(false);

    async function login(username: string, password: string): Promise<AuthResponse> {
        setLoading(true);
        try {
            const data = await loginApi(username, password); // { token, username, role }
            localStorage.setItem("token", data.token);
            const currentUser: CurrentUser = { username: data.username, role: data.role };
            localStorage.setItem("user", JSON.stringify(currentUser));
            setUser(currentUser);
            return data;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }


    useEffect(() => {
        function handleStorage(e: StorageEvent) {
            if (e.key === "token" && !e.newValue) {
                setUser(null);
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