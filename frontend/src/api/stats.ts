import apiClient from "./client";
import type { StatisticsResponse, BaseResponse } from "../types";

export async function getAllStats(date?: string): Promise<StatisticsResponse[]> {
    const res = await apiClient.get<BaseResponse<StatisticsResponse[]>>("/api/stats", {
        params: { date },
    });
    return res.data.data;
}

export async function getStatsByCamera(
    cameraId: number,
    date?: string
): Promise<StatisticsResponse> {
    const res = await apiClient.get<BaseResponse<StatisticsResponse>>(
        `/api/stats/${cameraId}`,
        { params: { date } }
    );
    return res.data.data;
}

export async function getStatsByCameraRange(
    cameraId: number,
    from: string,
    to: string
): Promise<StatisticsResponse[]> {
    const res = await apiClient.get<BaseResponse<StatisticsResponse[]>>(
        `/api/stats/${cameraId}/range`,
        { params: { from, to } }
    );
    return res.data.data;
}