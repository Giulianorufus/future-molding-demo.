// Validazioni minime per form Parametri: numeri, range e unità coerenti.
export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const toNum = (v: unknown, def = 0) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : (v as number);
  return Number.isFinite(n) ? n : def;
};
// clamp con guardia
export const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

// Insieme di check tipici
export function validateInputs(i: {
  // accept either legacy `volumeCavita_cm3` or newer `volumePezzo_cm3`
  volumeCavita_cm3?: unknown;
  volumePezzo_cm3?: unknown;
  volumeMaterozza_cm3?: unknown;
  cushionTarget_cm3?: unknown;
  spessore_mm?: unknown;
}) {
  // prefer piece volume if provided under new name
  const rawPiece = i.volumePezzo_cm3 ?? i.volumeCavita_cm3;
  const volumeCavita_cm3 = clamp(toNum(rawPiece), 0, 1e5);
  const volumeMaterozza_cm3 = clamp(toNum(i.volumeMaterozza_cm3), 0, 1e5);
  const cushionTarget_cm3 = clamp(toNum(i.cushionTarget_cm3, 1), 0, 1e4);
  const spessore_mm = clamp(toNum(i.spessore_mm, 2), 0.2, 20);
  const total = volumeCavita_cm3 + volumeMaterozza_cm3;
  // Materozza non obbligatoria: ok se il volume pezzo (volumeCavita/volumePezzo) è > 0
  return {
    ok: volumeCavita_cm3 > 0 && spessore_mm > 0,
    volumeCavita_cm3,
    volumeMaterozza_cm3,
    cushionTarget_cm3,
    spessore_mm,
    total_cm3: total,
    reason: volumeCavita_cm3 <= 0 ? "Volume pezzo mancante o nullo" : undefined,
  };
}