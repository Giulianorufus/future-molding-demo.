// Validazioni minime per form Parametri: numeri, range e unità coerenti.
export const isNum = (v) => typeof v === "number" && Number.isFinite(v);
export const toNum = (v, def = 0) => {
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
    return Number.isFinite(n) ? n : def;
};
// clamp con guardia
export const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
// Insieme di check tipici
export function validateInputs(i) {
    const volumeCavita_cm3 = clamp(toNum(i.volumeCavita_cm3), 0, 1e5);
    const volumeMaterozza_cm3 = clamp(toNum(i.volumeMaterozza_cm3), 0, 1e5);
    const cushionTarget_cm3 = clamp(toNum(i.cushionTarget_cm3, 1), 0, 1e4);
    const spessore_mm = clamp(toNum(i.spessore_mm, 2), 0.2, 20);
    const total = volumeCavita_cm3 + volumeMaterozza_cm3;
    return {
        ok: total > 0 && spessore_mm > 0,
        volumeCavita_cm3, volumeMaterozza_cm3, cushionTarget_cm3, spessore_mm, total_cm3: total,
        reason: total <= 0 ? "Volume totale nullo" : undefined,
    };
}
