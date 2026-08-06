import { useEffect, useRef, useState } from "react";
import { getStreamUrl } from "../api/cameras";

interface LiveStreamProps {
    cameraId: number;
    alt: string;
    className?: string;
    refreshIntervalMs?: number;
}

export default function LiveStream({ cameraId, alt, className, refreshIntervalMs = 4 * 60 * 1000 }: LiveStreamProps) {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    async function reconnect() {
        const url = await getStreamUrl(cameraId);
        setStreamUrl(url);
    }

    useEffect(() => {
        void reconnect();
        const interval = setInterval(() => {
            void reconnect();
        }, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [cameraId, refreshIntervalMs]);

    function handleError() {
        void reconnect();
    }

    if (!streamUrl) return null;

    return <img ref={imgRef} src={streamUrl} alt={alt} className={className} onError={handleError} />;
}