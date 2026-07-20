import { useRef, useState } from "react";

interface RegionEditorProps {
    videoWidth: number;
    videoHeight: number;
    initialRegion: number[][];
    imageSrc: string;
    onSave: (region: number[][]) => void;
    onCancel: () => void;
    saving?: boolean;
}

export default function RegionEditor({
                                         videoWidth,
                                         videoHeight,
                                         initialRegion,
                                         imageSrc,
                                         onSave,
                                         onCancel,
                                         saving = false,
                                     }: RegionEditorProps) {
    const [points, setPoints] = useState<number[][]>(
        initialRegion.length >= 2 ? initialRegion.map((p) => [...p]) : []
    );
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    function screenToVideoCoords(clientX: number, clientY: number): [number, number] {
        const svg = svgRef.current;
        if (!svg) return [0, 0];
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return [0, 0];
        const transformed = pt.matrixTransform(ctm.inverse());
        return [Math.round(transformed.x), Math.round(transformed.y)];
    }

    function handleBackgroundClick(e: React.MouseEvent<SVGSVGElement>) {
        if (draggingIndex !== null) return; // vừa thả điểm xong, không tính là click thêm mới
        const [x, y] = screenToVideoCoords(e.clientX, e.clientY);
        setPoints((prev) => [...prev, [x, y]]);
    }

    function handlePointerDownOnHandle(index: number, e: React.PointerEvent) {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDraggingIndex(index);
    }

    function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
        if (draggingIndex === null) return;
        const [x, y] = screenToVideoCoords(e.clientX, e.clientY);
        setPoints((prev) =>
            prev.map((p, i) => (i === draggingIndex ? [x, y] : p))
        );
    }

    function handlePointerUp() {
        setTimeout(() => setDraggingIndex(null), 0);
    }

    function handleRemovePoint(index: number, e: React.MouseEvent) {
        e.stopPropagation();
        setPoints((prev) => prev.filter((_, i) => i !== index));
    }

    function handleUndo() {
        setPoints((prev) => prev.slice(0, -1));
    }

    function handleReset() {
        setPoints([]);
    }

    const isClosedPolygon = points.length >= 3;
    const pointsAttr = points.map((p) => p.join(",")).join(" ");

    return (
        <div className="flex flex-col gap-3">
            <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: `${videoWidth} / ${videoHeight}` }}
            >
                <img
                    src={imageSrc}
                    alt="region-editor-frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                />
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${videoWidth} ${videoHeight}`}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    onClick={handleBackgroundClick}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {points.length >= 2 && (
                        <polyline
                            points={pointsAttr}
                            fill="none"
                            stroke="#e600e6"
                            strokeWidth={videoWidth / 400}
                        />
                    )}
                    {isClosedPolygon && (
                        <line
                            x1={points[points.length - 1][0]}
                            y1={points[points.length - 1][1]}
                            x2={points[0][0]}
                            y2={points[0][1]}
                            stroke="#e600e6"
                            strokeWidth={videoWidth / 400}
                        />
                    )}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p[0]}
                                cy={p[1]}
                                r={videoWidth / 160}
                                fill="#ff2d2d"
                                stroke="white"
                                strokeWidth={videoWidth / 800}
                                className="cursor-move"
                                onPointerDown={(e) => handlePointerDownOnHandle(i, e)}
                                onDoubleClick={(e) => handleRemovePoint(i, e)}
                            />
                            <text
                                x={p[0] + videoWidth / 100}
                                y={p[1] - videoWidth / 100}
                                fill="yellow"
                                fontSize={videoWidth / 45}
                                className="pointer-events-none select-none"
                            >
                                {i + 1}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            <p className="text-sm text-gray-500">
                Click vào vùng trống để thêm điểm • Kéo điểm đỏ để di chuyển • Double-click vào điểm để xoá riêng điểm đó
            </p>

            <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={points.length === 0}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Undo điểm cuối
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        Xoá hết
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(points)}
                        disabled={points.length < 2}
                        className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                        {saving ? "Đang lưu..." : "Lưu vùng đếm"}
                    </button>
                </div>
            </div>
        </div>
    );
}