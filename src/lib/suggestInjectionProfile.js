export function suggestHoldingProfile({ volume_cm3, material, pressSpecs }) {
    // Esempio semplice: 3 tappe di mantenimento
    const steps = [];
    const total_s = Math.max(4, Math.min(12, volume_cm3 / 10));
    const basePressure = Math.min(pressSpecs.maxInjectionPressure_bar, Math.max(600, material.viscosity * 8));
    // Step 1: mantenimento alto
    steps.push({
        pressione: basePressure,
        tempo_s: total_s * 0.5,
        da_s: 0,
        a_s: total_s * 0.5
    });
    // Step 2: transizione
    steps.push({
        pressione: basePressure * 0.7,
        tempo_s: total_s * 0.3,
        da_s: total_s * 0.5,
        a_s: total_s * 0.8
    });
    // Step 3: mantenimento basso
    steps.push({
        pressione: basePressure * 0.5,
        tempo_s: total_s * 0.2,
        da_s: total_s * 0.8,
        a_s: total_s
    });
    return steps;
}
export function suggestInjectionProfile({ Vcar, // cm³
Pc, // cm³
t_mm, materiale, // { tipo: "ABS"|"PC"|"PP"|"PA-GF"|..., viscosita: "bassa|media|alta", shearSensitive: boolean }
estetico = false, zoneSottili = false, longRunner = false, difettiStorico = [], // es. ["striature","incompleto","jetting"]
Vdot_max = 200, // cm³/s (esempio: prendi da macchina reale)
Pmax = 1800 // bar
 }) {
    const Vfill = Math.max(0, Vcar - Pc);
    if (Vfill <= 0) {
        return {
            steps: 1,
            switchesCm3: [Pc],
            speedsCm3s: [10],
            pressuresBar: [100],
            Vfill: 0,
            notes: ["Vfill<=0: controlla Pc/Volume"]
        };
    }
    // 1) n° tappe
    const hasFlowIssues = difettiStorico.includes("striature") || difettiStorico.includes("linee di flusso") || difettiStorico.includes("jetting");
    let steps = 1;
    if (t_mm <= 1.2 || (estetico && (materiale.tipo === "PC" || materiale.tipo?.includes("PA"))) || (longRunner && hasFlowIssues)) {
        steps = 3;
    }
    else if (t_mm < 2.5 || estetico || zoneSottili || hasFlowIssues) {
        steps = 2;
    }
    // 2) switch positions (cm³ residui)
    let switches = [];
    if (steps === 1) {
        switches = [Pc];
    }
    else if (steps === 2) {
        switches = [0.70 * Vfill, Pc];
    }
    else {
        switches = [0.50 * Vfill, 0.85 * Vfill, Pc];
    }
    switches = switches.map(x => Number(x.toFixed(2)));
    // 3) t_fill_target e Vdot_avg
    let k_t = t_mm >= 2.5 ? 0.020 : (t_mm <= 1.2 ? 0.040 : 0.030);
    if (estetico)
        k_t *= 1.3;
    const t_fill_target = Math.max(0.2, k_t * (Vfill / Math.max(0.5, t_mm))); // guard-rail
    const Vdot_avg_raw = Vfill / t_fill_target;
    const Vdot_min = 10;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    // 4) velocità per tappa
    let speeds = [];
    if (steps === 1) {
        speeds = [Vdot_avg_raw];
    }
    else if (steps === 2) {
        speeds = [1.1 * Vdot_avg_raw, 0.8 * Vdot_avg_raw];
    }
    else {
        speeds = [1.2 * Vdot_avg_raw, 1.0 * Vdot_avg_raw, 0.7 * Vdot_avg_raw];
    }
    // correzioni materiale/difetti
    const viscAlta = materiale.viscosita === "alta" || materiale.tipo === "PC" || materiale.tipo?.includes("PA-GF");
    if (viscAlta)
        speeds = speeds.map(v => 0.9 * v);
    if (zoneSottili)
        speeds[0] = 1.1 * speeds[0];
    if (hasFlowIssues)
        speeds = speeds.map(v => 0.9 * v);
    // clamp
    speeds = speeds.map(v => Number(clamp(v, Vdot_min, Vdot_max).toFixed(1)));
    // 5) pressioni per tappa
    const coeff = (() => {
        switch (true) {
            case materiale.tipo === "PC" || materiale.tipo?.includes("PA-GF"): return { a: 7, b: 80 };
            case materiale.tipo === "PP" || materiale.tipo === "PE": return { a: 4, b: 40 };
            default: return { a: 5, b: 50 }; // ABS o generico
        }
    })();
    let pressures = speeds.map(v => Math.min(Pmax, Math.round(coeff.a * v + coeff.b) + 100));
    return {
        steps,
        switchesCm3: switches,
        speedsCm3s: speeds,
        pressuresBar: pressures,
        Vfill: Number(Vfill.toFixed(2)),
        notes: [
            "Pc = cuscino + margine. Pc deve restare < Volume di carica.",
            "Pressione effettiva è decisa dalla pressa; valori mostrati = stima iniziale (+100 bar).",
            estetico ? "Modalità estetica attiva: tempi più lunghi e velocità ridotte." : null
        ].filter(Boolean)
    };
}
