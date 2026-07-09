import apiClient from "./client";
import type { AuthResponse, CurrentUser, Role, BaseResponse } from "../types";

export async function login(
    username: string,
    password: string
): Promise<AuthResponse> {
    const res = await apiClient.post<BaseResponse<AuthResponse>>(
        "/api/auth/login",
        { username, password }
    );
    return res.data.data;
}

export async function register(
    username: string,
    password: string,
    role: Role
): Promise<AuthResponse> {
    const res = await apiClient.post<BaseResponse<AuthResponse>>(
        "/api/auth/register",
        { username, password, role }
    );
    return res.data.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
    const res = await apiClient.get<BaseResponse<CurrentUser>>("/api/auth/me");
    return res.data.data;
}