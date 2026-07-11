import type { CounterDataResponse } from "../types";

export const STALE_THRESHOLD_MS = 10_000;

export function isSnapshotLive(snapshot?: CounterDataResponse): boolean {
    if (!snapshot) return false;
    const recordedAt = new Date(snapshot.recordedAt).getTime();
    return Date.now() - recordedAt < STALE_THRESHOLD_MS;
}