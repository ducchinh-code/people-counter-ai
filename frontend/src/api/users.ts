import apiClient from "./client";
import type { UserResponse, RegisterRequest, Role, BaseResponse } from "../types";

export async function getAllUsers(): Promise<UserResponse[]> {
    const res = await apiClient.get<BaseResponse<UserResponse[]>>("/api/auth/users");
    return res.data.data;
}

export async function createUser(payload: RegisterRequest): Promise<void> {
    await apiClient.post("/api/auth/register", payload);
}

export async function toggleUser(id: number): Promise<UserResponse> {
    const res = await apiClient.patch<BaseResponse<UserResponse>>(
        `/api/auth/users/${id}/toggle`
    );
    return res.data.data;
}

export async function updateUserRole(id: number, role: Role): Promise<UserResponse> {
    const res = await apiClient.put<BaseResponse<UserResponse>>(
        `/api/auth/users/${id}/role`,
        { role }
    );
    return res.data.data;
}

export async function deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/api/auth/users/${id}`);
}