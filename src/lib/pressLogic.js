export function deriveFromPress(press, opts) {
    const part = (opts?.partVolume_cm3 ?? 0) + (opts?.runnerVolume_cm3 ?? 0);
    const mat = opts?.materialFactor ?? 1; // es. PA-GF40=1.1, PC=1.05, PP=1.0
    // Shot utile: 30–70% del max, ma se il pezzo è noto centriamo attorno al 50–80% del part.
    const uMin = Math.max(press.maxShot_cm3 * 0.30, part * 1.2 * 0.5); // margine riempimento
    const uMax = Math.min(press.maxShot_cm3 * 0.70, Math.max(press.maxShot_cm3 * 0.6, part * 1.2 * 0.8));
    // Velocità target: 35–65% della capacità, aumentabile per pareti sottili (materialFactor >1).
    const vMin = Math.max(press.maxInjectionSpeed_cm3s * 0.35, 30);
    const vMax = Math.min(press.maxInjectionSpeed_cm3s * (0.65 * mat), press.maxInjectionSpeed_cm3s);
    // Pressione di picco consigliata: 55–75% della max, materiale "duro" alza il tetto.
    const pMin = Math.round(press.maxInjectionPressure_bar * 0.55);
    const pMax = Math.round(press.maxInjectionPressure_bar * Math.min(0.75 * mat, 0.9));
    // Forza di chiusura consigliata: 60–85% nominale (evita over-clamp continuo).
    const cMin = Math.round(press.clampForce_kN * 0.60);
    const cMax = Math.round(press.clampForce_kN * 0.85);
    // Cushion: minimo macchina + margine sul volume (2–4% dello shot)
    const cushionTarget = Math.max(press.minCushion_cm3, Math.round((part * 0.03) * 10) / 10);
    return {
        recommendedClamp_kN: { min: cMin, max: cMax },
        usefulShot_cm3: { min: Math.round(uMin), max: Math.round(uMax) },
        injSpeed_cm3s: { min: Math.round(vMin), max: Math.round(vMax) },
        injPressure_bar: { min: pMin, max: pMax },
        cushion_cm3: { min: press.minCushion_cm3, target: cushionTarget },
    };
}
