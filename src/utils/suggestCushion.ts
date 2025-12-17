import { materialCatalog, getMaterialInput } from "@/data/materialCatalog";

// Tipi minimi per evitare dipendenze incrociate
export type Viscosity = "alta" | "media" | "bassa" | "elastomero";

function getViscosity(code?: string): Viscosity | undefined {
  if (!code) return;
  const m = getMaterialInput(code) as any;
  if (!m) return undefined;
  const id = (m.id || '').toUpperCase();
  if (id.includes('TPU') || id.includes('TPE')) return 'elastomero';
  const vf = Number(m.viscosityFactor ?? 1);
  if (vf >= 1.3) return 'alta';
  if (vf >= 1.0) return 'media';
  return 'bassa';
}

/**
 * Regola industriale:
 * - base = 2% dello shot (cm³)
 * - clamp finale: 0.3 .. 3.0 cm³
 * - correzioni:
 *    * utilizzo shot (U = (cavity+runner)/shot):
 *        U >= 0.70  => base *= 0.7   (si riduce per evitare corto colpo in fine corsa)
 *        U <= 0.30  => base *= 1.2   (si aumenta perché la colonna è meno "carica")
 *    * viscosità materiale:
 *        alta => +20%   | media => 0 | bassa => -20% | elastomero => +10%
 *    * diametro vite:
 *        <20 mm => +10% | >30 mm => -10%
 */
export function suggestCushionTarget(params: {
  shotSize_cm3: number;           // dalla pressa selezionata
  cavityVolume_cm3: number;       // dal CAD
  runnerVolume_cm3: number;       // dal CAD/gating
  screw_diam_mm?: number;         // dalla pressa selezionata
  materialCode?: string;          // es. "PC", "ABS", ...
}): number {
  const shot = Math.max(0, params.shotSize_cm3 || 0);
  const fillVol = Math.max(0, (params.cavityVolume_cm3 || 0) + (params.runnerVolume_cm3 || 0));
  let base = 0.02 * shot; // 2% shot

  if (shot > 0) {
    const U = fillVol / shot;
    if (U >= 0.70) base *= 0.7;
    else if (U <= 0.30) base *= 1.2;
  }

  const visc = getViscosity(params.materialCode);
  if (visc === "alta") base *= 1.2;
  else if (visc === "bassa") base *= 0.8;
  else if (visc === "elastomero") base *= 1.1;

  const d = params.screw_diam_mm || 0;
  if (d > 0 && d < 20) base *= 1.1;
  else if (d > 30) base *= 0.9;

  // clamp industriale
  const clamped = Math.max(0.3, Math.min(3.0, base));
  // arrotonda a 0.1 cm³
  return Math.round(clamped * 10) / 10;
}