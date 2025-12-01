// utils/suggestMoldTemps.js
export function suggestMoldTemps({
  moldRange,         // [Tmin, Tmax] dal materiale, es. [70, 120] per PC
  thinZones,         // boolean: t_min ≤ 1.2 mm dal CAD
  defectLabel,       // etichetta difetto selezionata o null
  pressMoldLimits    // opzionale: { tMin: 0, tMax: 140 } limiti termoregolatore/pressa
}) {
  const [mMin, mMax] = moldRange || [30, 100];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // target base
  let target = (mMin + mMax) / 2;
  if (thinZones) target = Math.min(mMax, target + 5);

  let fixed = target;        // Parte fissa
  let moving = target - 5;   // Parte mobile

  // Store original values for clamping detection
  const originalFixed = fixed;
  const originalMoving = moving;

  // Correzioni difetti (parole chiave robuste)
  const d = (defectLabel || "").toLowerCase();
  const has = (s) => d.includes(s);

  if (has("imbarc") || has("warp") || has("piegat")) {
    // scalda un filo la mobile per ridurre gradienti
    moving += 5;
  }
  if (has("linee di flusso") || has("incompletezza")) {
    fixed  += 5;
    moving += 5;
  }
  if (has("striature") || has("bolle")) {
    fixed  -= 5; // leggermente più freddo lato fissa per ridurre degassamento
  }

  // Clamp a range materiale e (se forniti) limiti macchina
  let lo = mMin, hi = mMax;
  if (pressMoldLimits) {
    lo = Math.max(lo, pressMoldLimits.tMin ?? lo);
    hi = Math.min(hi, pressMoldLimits.tMax ?? hi);
  }
  
  fixed  = clamp(fixed,  lo, hi);
  moving = clamp(moving, lo, hi);

  // Check if any temperature was clamped
  const wasClamped = (originalFixed !== fixed) || (originalMoving !== moving);

  return { 
    ParteFissa: Math.round(fixed), 
    ParteMobile: Math.round(moving),
    wasClamped
  };
}