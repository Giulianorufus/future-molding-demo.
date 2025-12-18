import type { MaterialProfile } from "@/types/material";

export type MaterialEffects = {
  multipliers: {
    pressure: number;
    flow: number;
    cooling: number;
  };
  recommendedTemps: {
    meltTempC: number;
    moldTempC: number;
  };
  warnings: string[];
  assumptions: string[];
};

export function materialEffects(material: MaterialProfile | null): MaterialEffects {
  if (!material) {
    return {
      multipliers: { pressure: 1, flow: 1, cooling: 1 },
      recommendedTemps: { meltTempC: 0, moldTempC: 0 },
      warnings: [],
      assumptions: [],
    };
  }

  const warnings: string[] = [];
  const assumptions: string[] = [];

  const meltTempC = material.meltTempC?.default ?? 0;
  const moldTempC = material.moldTempC?.default ?? 0;

  // Drying rules
  if (material.hygroscopic || (material.drying && material.drying.required)) {
    assumptions.push("Si assume materiale essiccato secondo scheda tecnica.");
    const t = material.drying?.tempC ?? "?";
    const h = material.drying?.hours ?? "?";
    warnings.push(
      `Materiale igroscopico: essiccazione consigliata (${t}°C, ${h}h). Se umido: splay/bolle/calo proprietà.`
    );
  }

  // PC specific: idrolisi
  if (String(material.id).toLowerCase() === "pc" || material.family === "PC") {
    warnings.push("PC: rischio idrolisi se umido; evitare permanenze alte e materiale bagnato.");
  }

  // Glass-fiber rules
  const gf = Number(material.gfPct || 0);
  if (gf >= 30) {
    warnings.push(
      "Materiale rinforzato vetro: abrasione elevata (vite/valvola/ugello) e possibile aumento pressione."
    );
    warnings.push("GF: ritiro anisotropo (attenzione a deformazioni e tolleranze).");
  }
  if (gf >= 60) {
    warnings.push("GF60: abrasione molto alta e viscosità elevata → verificare capacità pressa e usura.");
  }

  // Multipliers: prefer explicit factors from profile, fallback to 1
  const multipliers = {
    pressure: typeof material.pressureFactor === 'number' ? material.pressureFactor : 1,
    flow: typeof material.flowFactor === 'number' ? material.flowFactor : 1,
    cooling: typeof material.coolingFactor === 'number' ? material.coolingFactor : 1,
  };

  return {
    multipliers,
    recommendedTemps: { meltTempC, moldTempC },
    warnings,
    assumptions,
  };
}
