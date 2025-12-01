const LIMITS = {
    screw_mm: { min: 12, max: 80 },
    pack_bar: { min: 200, max: 1800 },
    mold_C: { min: 10, max: 140 },
    cool_s: { min: 2, max: 180 },
    inj_cm3s: { min: 1, max: 600 },
};
export function validateRun(inputs, out) {
    const issues = [];
    if (!inputs.pressId)
        issues.push({ kind: "missing", msg: "Pressa non selezionata", severity: "high" });
    if (!inputs.modelId)
        issues.push({ kind: "missing", msg: "Modello pressa non selezionato", severity: "high" });
    if (inputs.screwDiameter_mm != null) {
        const v = inputs.screwDiameter_mm;
        const { min, max } = LIMITS.screw_mm;
        if (v < min || v > max) {
            issues.push({ kind: "range", field: "screwDiameter_mm", msg: `Diametro vite fuori range (${min}–${max} mm)`, severity: "high" });
        }
    }
    if (out.packPressure_bar != null) {
        const v = Number(out.packPressure_bar);
        const { min, max } = LIMITS.pack_bar;
        if (v < min || v > max) {
            issues.push({ kind: "range", field: "packPressure_bar", msg: `Post-pressione fuori range (${min}–${max} bar)`, severity: v > max ? "high" : "medium" });
        }
    }
    if (out.moldTemp_C != null) {
        const v = Number(out.moldTemp_C);
        const { min, max } = LIMITS.mold_C;
        if (v < min || v > max) {
            issues.push({ kind: "range", field: "moldTemp_C", msg: `Temperatura stampo fuori range (${min}–${max} °C)`, severity: "medium" });
        }
    }
    if (out.cooling_s != null) {
        const v = Number(out.cooling_s);
        const { min, max } = LIMITS.cool_s;
        if (v < min || v > max) {
            issues.push({ kind: "range", field: "cooling_s", msg: `Raffreddamento fuori range (${min}–${max} s)`, severity: "low" });
        }
    }
    if (out.injectionSpeed_cm3s != null) {
        const v = Number(out.injectionSpeed_cm3s);
        const { min, max } = LIMITS.inj_cm3s;
        if (v < min || v > max) {
            issues.push({ kind: "range", field: "injectionSpeed_cm3s", msg: `Velocità iniezione fuori range (${min}–${max} cm³/s)`, severity: "medium" });
        }
    }
    if (inputs.partVolume_cm3 && out.switchOver_cm3 != null) {
        if (Number(out.switchOver_cm3) > inputs.partVolume_cm3 * 1.2) {
            issues.push({ kind: "logic", field: "switchOver_cm3", msg: "Punto di commutazione incoerente con volume pezzo", severity: "high" });
        }
    }
    return issues;
}
