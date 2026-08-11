import apiClient from "./client";
import type { BaseResponse } from "../types";

export interface AuditLogEntry {
    id: number;
    username: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    detail: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogPage {
    content: AuditLogEntry[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export async function getAuditLogs(params: {
    username?: string;
    action?: string;
    page?: number;
    size?: number;
}): Promise<AuditLogPage> {
    const res = await apiClient.get<BaseResponse<AuditLogPage>>("/api/audit-logs", {
        params,
    });
    return res.data.data;
}