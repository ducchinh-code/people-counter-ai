interface JwtPayload {
    exp?: number;
    sub?: string;
    [key: string]: unknown;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const payloadPart = token.split(".")[1];
        if (!payloadPart) return null;

        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export function getTokenExpiryMs(token: string): number | null {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return null;
    return payload.exp * 1000;
}