import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
// 🔧 Import “difensivo” dello store: prende named export useAppStore oppure default
// (evita errori di tipo "non esiste useAppStore" o path alias "@/")
import * as appStoreMod from "../store/appStore";
const useAppStore = appStoreMod.useAppStore ?? appStoreMod.default;
// 🔖 Label+unità minime locali (puoi sostituirle con le tue quando vuoi)
function getLabelUnit(key) {
    const map = {
        injectionSpeed: { label: "Velocità di iniezione", unit: "cm³/s" },
        injectionPressure: { label: "Pressione di iniezione", unit: "bar" },
        switchoverPoint: { label: "Punto di commutazione", unit: "cm³" },
        meltTemperature: { label: "Temperatura massa", unit: "°C" },
        moldTemperature: { label: "Temperatura stampo", unit: "°C" },
        clampForce: { label: "Forza di chiusura", unit: "kN" },
        coolingTime: { label: "Tempo di raffreddamento", unit: "s" },
    };
    return map[key] ?? { label: key };
}
// 🧱 Box valore semplice (no dipendenze da componenti esterni)
const Row = ({ k, v }) => {
    const lu = useMemo(() => getLabelUnit(k), [k]);
    return (_jsxs("div", { className: "flex justify-between items-center border-b border-gray-200 py-2", children: [_jsx("div", { className: "text-sm text-gray-600", children: lu.label }), _jsxs("div", { className: "font-medium", children: [v ?? "—", " ", lu.unit ? _jsx("span", { className: "text-gray-500", children: lu.unit }) : null] })] }));
};
const Parametri = () => {
    // 📦 Leggi gli input base dallo store con fallback ai nomi italiani
    const material = useAppStore((s) => s.material ?? s.materiale);
    const press = useAppStore((s) => s.press ?? s.pressa ?? s.marca);
    const model = useAppStore((s) => s.model ?? s.modello);
    const drawing = useAppStore((s) => s.drawing ?? s.disegno);
    const avgThickness = useAppStore((s) => s.avgThickness ?? s.spessoreMedio);
    const cavityVolume = useAppStore((s) => s.cavityVolume ?? s.volumeCavita);
    const sprueVolume = useAppStore((s) => s.sprueVolume ?? s.volumeMaterozza);
    // 🔎 I parametri calcolati (leggi senza scrivere: niente loop)
    const params = useAppStore((s) => s.params ?? s.parametri);
    // 🧭 Info input in alto (solo lettura)
    const inputInfo = [
        ["Materiale", material],
        ["Pressa", press],
        ["Modello", model],
        ["Disegno", drawing?.name ?? drawing?.filename ?? (drawing ? "Caricato" : "—")],
        ["Spessore medio (mm)", avgThickness],
        ["Vol. cavità (cm³)", cavityVolume],
        ["Vol. materozza (cm³)", sprueVolume],
    ];
    // Se non hai ancora parametri calcolati, mostra istruzioni pulite
    if (!params) {
        return (_jsxs("main", { className: "p-6 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-4", children: "Parametri di stampaggio" }), _jsxs("div", { className: "rounded-xl border p-4 bg-white", children: [_jsxs("p", { className: "mb-3", children: ["Carica ", _jsx("strong", { children: "disegno" }), ", scegli ", _jsx("strong", { children: "materiale" }), " e", " ", _jsx("strong", { children: "pressa/modello" }), ". Dopo il calcolo automatico i parametri appariranno qui."] }), _jsx("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-2 gap-3", children: inputInfo.map(([k, v]) => (_jsxs("div", { className: "border rounded-lg p-3", children: [_jsx("div", { className: "text-xs text-gray-500", children: k }), _jsx("div", { className: "font-medium", children: v ?? "—" })] }, String(k)))) })] })] }));
    }
    // 🔑 chiavi mostrate (adatta liberamente)
    const keys = [
        "injectionSpeed",
        "injectionPressure",
        "switchoverPoint",
        "meltTemperature",
        "moldTemperature",
        "clampForce",
        "coolingTime",
    ];
    return (_jsxs("main", { className: "p-6 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-4", children: "Parametri di stampaggio" }), _jsxs("div", { className: "rounded-xl border p-4 bg-white mb-6", children: [_jsx("h2", { className: "text-sm font-semibold mb-3", children: "Input" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: inputInfo.map(([k, v]) => (_jsxs("div", { className: "border rounded-lg p-3", children: [_jsx("div", { className: "text-xs text-gray-500", children: k }), _jsx("div", { className: "font-medium", children: v ?? "—" })] }, String(k)))) })] }), _jsxs("div", { className: "rounded-xl border p-4 bg-white", children: [_jsx("h2", { className: "text-sm font-semibold mb-3", children: "Risultati" }), keys.map((k) => (_jsx(Row, { k: k, v: params?.[k] }, k)))] })] }));
};
export default Parametri;
