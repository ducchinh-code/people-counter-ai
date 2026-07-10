export type Role = "ADMIN" | "USER";

export interface AuthResponse {
    token: string;
    username: string;
    role: Role;
}

export interface CurrentUser {
    username: string;
    role: Role;
}

export interface RegisterRequest {
    username: string;
    password: string;
    role: Role;
}

export interface UserResponse {
    id: number;
    username: string;
    role: Role;
    enabled: boolean;
    createdAt: string;
}

export interface CameraResponse {
    id: number;
    name: string;
    source: string;
    region: number[][];
    tracker: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CameraRequest {
    name: string;
    source: string;
    region: number[][];
    tracker: string;
    enabled: boolean;
}

export interface CounterDataResponse {
    id: number;
    cameraId: number;
    cameraName: string;
    hour: string;
    inCount: number;
    outCount: number;
    total: number;
    partial: boolean;
    recordedAt: string;
}

export interface HourlyData {
    hour: string;
    inCount: number;
    outCount: number;
    total: number;
    partial: boolean;
}

export interface StatisticsResponse {
    cameraId: number;
    cameraName: string;
    date: string;
    totalIn: number;
    totalOut: number;
    totalPeople: number;
    peakHour: string | null;
    peakTotal: number;
    hourlyData: HourlyData[];
}

export interface BaseResponse<T> {
    success: boolean;
    message: string;
    data: T;
}