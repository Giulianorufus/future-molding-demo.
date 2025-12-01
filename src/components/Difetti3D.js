import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Suspense } from "react";
function Model() {
    // Placeholder 3D geometry since no GLB model is available
    return (_jsxs("mesh", { children: [_jsx("boxGeometry", { args: [1, 0.5, 0.3] }), _jsx("meshStandardMaterial", { color: "hsl(var(--primary))" })] }));
}
function HotspotMarker({ position, label, onClick }) {
    return (_jsx(Html, { position: position, children: _jsx("div", { onClick: onClick, className: "bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded cursor-pointer shadow-md hover:bg-destructive/90 transition-colors", children: label }) }));
}
export default function Difetti3D() {
    const hotspots = [
        {
            position: [0.5, 0.5, 0],
            label: "Vuoto interno",
            onClick: () => alert("Correzione automatica: aumenta pressione di mantenimento"),
        },
        {
            position: [-0.5, 0.3, 0],
            label: "Bruciatura",
            onClick: () => alert("Correzione automatica: riduci velocità iniezione + aumenta sfiati"),
        },
    ];
    return (_jsx("div", { className: "w-full h-[500px] bg-muted rounded-lg shadow-md border", children: _jsxs(Canvas, { camera: { position: [2, 2, 2], fov: 50 }, children: [_jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [5, 5, 5], intensity: 1 }), _jsxs(Suspense, { fallback: null, children: [_jsx(Model, {}), hotspots.map((h, i) => (_jsx(HotspotMarker, { ...h }, i)))] }), _jsx(OrbitControls, { enablePan: true, enableZoom: true, enableRotate: true })] }) }));
}
