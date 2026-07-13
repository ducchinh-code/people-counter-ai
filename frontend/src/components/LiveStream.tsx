import { useEffect, useRef, useState } from "react";

interface LiveStreamProps {
    src: string;
    alt: string;
    className?: string;

    refreshIntervalMs?: number;
}

export default function LiveStream({
                                       src,
                                       alt,
                                       className,
                                       refreshIntervalMs = 4 * 60 * 1000, // mặc định 4 phút — an toàn dưới timeout 10 phút backend
                                   }: LiveStreamProps) {
    const [cacheBust, setCacheBust] = useState(0);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCacheBust((n) => n + 1);
        }, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [refreshIntervalMs]);

    useEffect(() => {
        return () => {
            if (imgRef.current) {
                imgRef.current.src = "";
            }
        };
    }, []);

    function handleError() {
        setCacheBust((n) => n + 1);
    }

    const separator = src.includes("?") ? "&" : "?";
    const bustedSrc = `${src}${separator}_r=${cacheBust}`;

    return (
        <img
            ref={imgRef}
            src={bustedSrc}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
}