import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { CounterDataResponse } from "../types";

interface SnapshotMap {
    [cameraId: number]: CounterDataResponse;
}

// Hook kết nối WebSocket (STOMP qua SockJS) tới backend, lắng nghe
// topic /topic/snapshots mà CounterWebSocketHandler đẩy mỗi 2 giây.
export function useSnapshotSocket() {
    const [snapshots, setSnapshots] = useState<SnapshotMap>({});
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

        const client = new Client({
            webSocketFactory: () => new SockJS(`${base}/ws`),
            reconnectDelay: 3000,
            onConnect: () => {
                setConnected(true);
                client.subscribe("/topic/snapshots", (message) => {
                    const data: CounterDataResponse[] = JSON.parse(message.body);
                    setSnapshots((prev) => {
                        const next = { ...prev };
                        data.forEach((s) => {
                            next[s.cameraId] = s;
                        });
                        return next;
                    });
                });
            },
            onDisconnect: () => setConnected(false),
            onStompError: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    return { snapshots, connected };
}