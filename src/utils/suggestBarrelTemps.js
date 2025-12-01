// utils/suggestBarrelTemps.js
export function suggestBarrelTemps({
  meltRange,        // [Tmin, Tmax], es. [260,320]
  zones,            // 3 | 4 | 5 (dalla pressa selezionata)
  materialType,     // "ABS"|"PC"|"PP"|"PA"|"POM"|...
  t_min_mm,         // spessore minimo dal disegno
  pressLimits,      // { tMin: 0, tMax: 350 }
  defectLabel       // string o null
}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const [mMin, mMax] = meltRange || [220, 300];
  let melt = (mMin + mMax) / 2;
  
  // Correzione per spessori sottili
  if (t_min_mm != null && t_min_mm <= 1.2) melt = Math.min(mMax, melt + 10);

  // Profilo base per ugello in funzione del materiale
  const isHotNozzle = /PC|PA/.test((materialType||"").toUpperCase());
  let ugelloOffset = isHotNozzle ? 8 : -5;

  // Calcolo zone
  let Z1, Z2, Z3, Z4, Z5;
  if (zones >= 5) {
    Z1 = melt - 40; Z2 = melt - 20; Z3 = melt; Z4 = melt + 10; Z5 = melt + 10;
  } else if (zones === 4) {
    Z1 = melt - 40; Z2 = melt - 15; Z3 = melt; Z4 = melt + 10;
  } else { // 3 zone
    Z1 = melt - 30; Z2 = melt - 10; Z3 = melt + 5;
  }
  let Ug = melt + ugelloOffset;

  // Correzioni difetti
  const d = (defectLabel || "").toLowerCase();
  const inc = d.includes("incompletezza") || d.includes("linee di flusso");
  const silver = d.includes("striature") || d.includes("bolle");
  const stringing = d.includes("filamenti");
  
  if (inc) { 
    Z3 += 10; 
    if (zones >= 4) Z4 = (Z4 ?? melt + 10) + 10; 
    if (zones >= 5) Z5 = (Z5 ?? melt + 10) + 10; 
    Ug += 10; 
  }
  if (silver) Ug -= 10;
  if (stringing) Ug -= 10;

  // Clamp a range materiale e limiti pressa
  const lo = Math.max(pressLimits?.tMin ?? 0, mMin);
  const hi = Math.min(pressLimits?.tMax ?? 400, mMax);
  
  const originalZ1 = Z1, originalZ2 = Z2, originalZ3 = Z3, originalZ4 = Z4, originalZ5 = Z5, originalUg = Ug;
  
  Z1 = clamp(Z1, lo, hi);
  Z2 = clamp(Z2, lo, hi);
  Z3 = clamp(Z3, lo, hi);
  if (zones >= 4) Z4 = clamp(Z4, lo, hi);
  if (zones >= 5) Z5 = clamp(Z5, lo, hi);
  Ug = clamp(Ug, lo, hi);

  // Check if any temperature was clamped
  let wasClamped = false;
  if (originalZ1 !== Z1 || originalZ2 !== Z2 || originalZ3 !== Z3 || originalUg !== Ug) wasClamped = true;
  if (zones >= 4 && originalZ4 !== Z4) wasClamped = true;
  if (zones >= 5 && originalZ5 !== Z5) wasClamped = true;

  const out = { Z1: Math.round(Z1), Z2: Math.round(Z2), Z3: Math.round(Z3), Ugello: Math.round(Ug), wasClamped };
  if (zones >= 4) out.Z4 = Math.round(Z4);
  if (zones >= 5) out.Z5 = Math.round(Z5);
  
  return out;
}