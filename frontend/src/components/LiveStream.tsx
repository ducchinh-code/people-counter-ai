import { useEffect, useRef, useState } from "react";
import { getStreamUrl } from "../api/cameras";

interface LiveStreamProps {
    cameraId: number;
    alt: string;
    className?: string;
    refreshIntervalMs?: number;
}

const MIN_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;

export default function LiveStream({
                                       cameraId,
                                       alt,
                                       className,
                                       refreshIntervalMs = 4 * 60 * 1000,
                                   }: LiveStreamProps) {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const retryCountRef = useRef(0);
    const reconnectingRef = useRef(false);
    const retryTimeoutRef = useRef<number | null>(null);
    const mountedRef = useRef(true);

    function clearScheduledRetry() {
        if (retryTimeoutRef.current !== null) {
            window.clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }

    async function reconnect() {
        if (reconnectingRef.current) {
            return;
        }
        reconnectingRef.current = true;
        try {
            const url = await getStreamUrl(cameraId);
            if (!mountedRef.current) {
                return;
            }
            retryCountRef.current = 0;
            setStreamUrl(url);
        } catch (err) {
            console.error("Failed to get stream URL", err);
            scheduleRetry();
        } finally {
            reconnectingRef.current = false;
        }
    }

    function scheduleRetry() {
        if (!mountedRef.current) {
            return;
        }
        const delay = Math.min(
            MIN_RETRY_DELAY_MS * 2 ** retryCountRef.current,
            MAX_RETRY_DELAY_MS
        );
        retryCountRef.current += 1;
        clearScheduledRetry();
        retryTimeoutRef.current = window.setTimeout(() => {
            void reconnect();
        }, delay);
    }

    useEffect(() => {
        mountedRef.current = true;
        retryCountRef.current = 0;
        void reconnect();

        const interval = setInterval(() => {
            void reconnect();
        }, refreshIntervalMs);

        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                void reconnect();
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
            clearScheduledRetry();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [cameraId, refreshIntervalMs]);

    useEffect(() => {
        return () => {
            if (imgRef.current) {
                imgRef.current.src = "";
            }
        };
    }, []);

    function handleError() {
        scheduleRetry();
    }

    function handleLoad() {
        // Đã nhận được frame/kết nối ổn định trở lại — reset backoff.
        retryCountRef.current = 0;
    }

    if (!streamUrl) {
        return null;
    }

    return (
        <img
            ref={imgRef}
            src={streamUrl}
            alt={alt}
            className={className}
            onError={handleError}
            onLoad={handleLoad}
        />
    );
}