// utils/runnerHot.js

export function adjustPressureForRunnerType(pressuresBar, runnerType) {
  // ΔP additiva solo per canale freddo (stima pratica)
  const delta = runnerType === "cold" ? 100 : 0; // 50–150 bar; usiamo 100 come default robusto
  return (pressuresBar || []).map(b => Math.max(0, b + delta));
}

// Suggerisce temperature per ugelli hot runner, uno per cavità.
export function suggestHotRunnerTemps({
  meltRange,        // [Tmin, Tmax], es. [260, 320]
  materialCode,     // "PC"|"PA"|"ABS"|"PP"|...
  t_min_mm,         // spessore minimo dal CAD
  cavities,         // n° cavità/ugelli (default 1)
  defectLabel,      // difetto o null
  limits            // opz: { tMin: 0, tMax: 400 } limiti del regolatore hot runner
}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const [mMin, mMax] = meltRange || [200, 320];
  let melt = (mMin + mMax) / 2;
  if (t_min_mm != null && t_min_mm <= 1.2) melt = Math.min(mMax, melt + 10);

  const code = (materialCode || "").toUpperCase();
  const hotOffset = /PC|PA/.test(code) ? 8 : -5; // PC/PA più caldo; ABS/PP/PS/PMMA/POM più freddo
  let base = melt + hotOffset;

  // Store original value for clamping detection
  const originalBase = base;

  // Correzioni difetti
  const d = (defectLabel || "").toLowerCase();
  if (d.includes("incompletezza") || d.includes("linee di flusso")) base += 10;
  if (d.includes("striature") || d.includes("bolle") || d.includes("degrad")) base -= 10;
  if (d.includes("filamenti") || d.includes("gocciol")) base -= 15;

  // Clamp a range materiale e limiti hot runner
  let lo = mMin, hi = mMax;
  if (limits) {
    lo = Math.max(lo, limits.tMin ?? lo);
    hi = Math.min(hi, limits.tMax ?? hi);
  }
  base = clamp(base, lo, hi);

  const n = Math.max(1, cavities || 1);
  // Stessa temp per tutti gli ugelli (semplice e robusto). In futuro: per-ugello per bilanciamento.
  const temps = Array.from({ length: n }, () => Math.round(base));

  // Check if temperature was clamped
  const wasClamped = originalBase !== base;

  return { 
    temperatures: temps, // [Ugello1, Ugello2, ...]
    wasClamped
  };
}