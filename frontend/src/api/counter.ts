import apiClient from "./client";
import type { CounterDataResponse, BaseResponse } from "../types";

export async function getAllSnapshots(): Promise<CounterDataResponse[]> {
    const res = await apiClient.get<BaseResponse<CounterDataResponse[]>>("/api/counter/snapshot");
    return res.data.data;
}

export async function getSnapshotByCamera(cameraId: number): Promise<CounterDataResponse> {
    const res = await apiClient.get<BaseResponse<CounterDataResponse>>(`/api/counter/snapshot/${cameraId}`);
    return res.data.data;
}