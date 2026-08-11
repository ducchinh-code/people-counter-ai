import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute.tsx";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import CameraManagement from "./pages/CameraManagement";
import UserManagement from "./pages/UserManagement";
import AuditLog from "./pages/AuditLog";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route
                            path="/cameras"
                            element={
                                <PrivateRoute adminOnly>
                                    <CameraManagement />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <PrivateRoute adminOnly>
                                    <UserManagement />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/audit-logs"
                            element={
                                <PrivateRoute adminOnly>
                                    <AuditLog />
                                </PrivateRoute>
                            }
                        />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}