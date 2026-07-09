import apiClient from "./client";
import type { CameraResponse, CameraRequest, BaseResponse } from "../types";

export async function getAllCameras(): Promise<CameraResponse[]> {
    const res = await apiClient.get<BaseResponse<CameraResponse[]>>("/api/cameras");
    return res.data.data;
}

export async function getEnabledCameras(): Promise<CameraResponse[]> {
    const res = await apiClient.get<BaseResponse<CameraResponse[]>>("/api/cameras/enabled");
    return res.data.data;
}

export async function getCameraById(id: number): Promise<CameraResponse> {
    const res = await apiClient.get<BaseResponse<CameraResponse>>(`/api/cameras/${id}`);
    return res.data.data;
}

export async function createCamera(payload: CameraRequest): Promise<CameraResponse> {
    const res = await apiClient.post<BaseResponse<CameraResponse>>("/api/cameras", payload);
    return res.data.data;
}

export async function updateCamera(id: number, payload: CameraRequest): Promise<CameraResponse> {
    const res = await apiClient.put<BaseResponse<CameraResponse>>(`/api/cameras/${id}`, payload);
    return res.data.data;
}

export async function toggleCamera(id: number): Promise<CameraResponse> {
    const res = await apiClient.patch<BaseResponse<CameraResponse>>(`/api/cameras/${id}/toggle`);
    return res.data.data;
}

export async function deleteCamera(id: number): Promise<void> {
    await apiClient.delete(`/api/cameras/${id}`);
}

export function getStreamUrl(cameraId: number): string {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return `${base}/api/cameras/${cameraId}/stream`;
}