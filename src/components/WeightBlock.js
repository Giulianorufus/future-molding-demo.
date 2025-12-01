import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function defaultRunnerFactor(system) {
    switch (system) {
        case "camera_calda": return 0.01;
        case "fredda_singolo_punto": return 0.35;
        case "fredda_bilanciata_2_4": return 0.25;
        case "fredda_bilanciata_>4": return 0.20;
        default: return 0.25;
    }
}
export function calcWeights(inp) {
    const notes = [];
    const pieceWeight_g_single = inp.pieceVolume_cm3 * inp.density_g_cm3;
    const pieceWeight_g_total = pieceWeight_g_single * inp.cavities;
    let runnerWeight_g = 0;
    if (typeof inp.coldRunnerVolume_cm3 === "number") {
        runnerWeight_g = inp.coldRunnerVolume_cm3 * inp.density_g_cm3;
        notes.push("Canali calcolati da volume canali fornito.");
    }
    else {
        const factor = typeof inp.runnerFactorOverride === "number"
            ? inp.runnerFactorOverride
            : defaultRunnerFactor(inp.runnerSystem);
        runnerWeight_g = pieceWeight_g_total * factor;
        notes.push(typeof inp.runnerFactorOverride === "number"
            ? `Fattore canali personalizzato: ${(factor * 100).toFixed(1)}%.`
            : `Fattore canali da tabella: ${(factor * 100).toFixed(1)}% (${inp.runnerSystem}).`);
    }
    const shotWeight_g = pieceWeight_g_total + runnerWeight_g;
    const injectedVolume_cm3 = shotWeight_g / inp.density_g_cm3;
    return {
        pieceWeight_g_single,
        pieceWeight_g_total,
        runnerWeight_g,
        shotWeight_g,
        injectedVolume_cm3,
        notes,
    };
}
const WeightBlock = (p) => {
    if (!p.visible)
        return null;
    const r = calcWeights({
        pieceVolume_cm3: p.pieceVolume_cm3,
        density_g_cm3: p.density_g_cm3,
        cavities: p.cavities,
        runnerSystem: p.runnerSystem,
        coldRunnerVolume_cm3: p.coldRunnerVolume_cm3,
        runnerFactorOverride: p.runnerFactorOverride,
    });
    const fmt = (x, d = 2) => x.toFixed(d);
    return (_jsxs("div", { className: "card", style: { padding: 12 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Peso pezzo & stampata" }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsxs("div", { children: ["\u2022 Peso pezzo (singolo): ", _jsxs("strong", { children: [fmt(r.pieceWeight_g_single), " g"] })] }), _jsxs("div", { children: ["\u2022 Peso pezzi totali (x", p.cavities, "): ", _jsxs("strong", { children: [fmt(r.pieceWeight_g_total), " g"] })] }), _jsxs("div", { children: ["\u2022 Materozza/Canali per ciclo: ", _jsxs("strong", { children: [fmt(r.runnerWeight_g), " g"] })] }), _jsxs("div", { children: ["\u2022 Peso stampata (shot): ", _jsxs("strong", { children: [fmt(r.shotWeight_g), " g"] })] }), _jsxs("div", { children: ["\u2022 Volume iniezione totale: ", _jsxs("strong", { children: [fmt(r.injectedVolume_cm3), " cm\u00B3"] })] })] }), r.notes.length > 0 && (_jsx("div", { style: { marginTop: 8, fontSize: 12, opacity: 0.8 }, children: r.notes.map((n, i) => _jsxs("div", { children: ["Nota: ", n] }, i)) }))] }));
};
export default WeightBlock;
