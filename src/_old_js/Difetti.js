import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState } from "react";
import { useDefectsStore } from "@/store/defectsStore";
export default function Difetti() {
    // FIX LOOP: seleziona solo la referenza, poi derivazione memoizzata
    const points = useDefectsStore((s) => s.points);
    const types = useMemo(() => Array.from(new Set(points.map((p) => p.type))), [points]);
    const [selected, setSelected] = useState([]);
    const toggle = (t) => setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-6", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Difetti" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2 border rounded-lg p-4", children: types.map((t) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: selected.includes(t), onChange: () => toggle(t) }), _jsx("span", { children: t })] }, t))) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "La selezione viene applicata al calcolo nei limiti macchina/materiale." })] }));
}
