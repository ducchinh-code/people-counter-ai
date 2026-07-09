import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
        isActive
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

export default function Layout() {
    const { user, isAdmin, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">
            People Counter AI
          </span>
                    <div className="flex gap-1 ml-6">
                        <NavLink to="/" end className={linkClass}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/stats" className={linkClass}>
                            Thống kê
                        </NavLink>
                        {isAdmin && (
                            <NavLink to="/cameras" className={linkClass}>
                                Quản lý Camera
                            </NavLink>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user?.username}{" "}
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {user?.role}
            </span>
          </span>
                    <button
                        onClick={logout}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                        Đăng xuất
                    </button>
                </div>
            </nav>

            <main className="p-6">
                <Outlet />
            </main>
        </div>
    );
}