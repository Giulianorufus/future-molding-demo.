import type { MaterialProfile } from "./materialTypes";

export interface MaterialEffectsResult {
  multipliers: MaterialProfile["effects"];
  assumptions: string[];
  warnings: string[];
}

export function computeMaterialEffects(m: MaterialProfile): MaterialEffectsResult {
  const assumptions: string[] = [];
  const warnings: string[] = [];

  if (!m.mvr_cm3_10min) assumptions.push("MVR non disponibile: uso viscosityClass per fallback.");
  if (m.reinforcement === "GF") warnings.push("Materiale rinforzato: pressione più alta e usura vite/cilindro.");

  // Stable order and deterministic result
  return { multipliers: m.effects, assumptions, warnings };
}

export default computeMaterialEffects;
