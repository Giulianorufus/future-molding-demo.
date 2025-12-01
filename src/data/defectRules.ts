import type { CalcInput } from "../engine/calcEngine";

export interface DefectRule {
  id: string;
  label: string;
  // suggested corrections expressed as a free-form map (overrides merged into store input)
  rules: Record<string, any>;
}

export const DEFECT_RULES: DefectRule[] = [
  { id: "short_shot", label: "Short Shot / Mancato riempimento", rules: { injectionSpeedOverride: "+20%", holdingPressureOverride: "+30 bar" } },
  { id: "cicca_incompleto", label: "Cicca / Incompleto", rules: { injectionSpeedOverride: "+15%", holdingPressureOverride: "+40 bar", meltTempOverride: "+5°C" } },
  { id: "linea_giunzione", label: "Linea di giunzione debole", rules: { injectionSpeedOverride: "+10%", meltTempOverride: "+5°C" } },
  { id: "linea_flusso", label: "Linea di flusso visibile", rules: { injectionSpeedOverride: "+5%", meltTempOverride: "+3°C" } },
  { id: "bruciature", label: "Segni di bruciatura (Burn Marks)", rules: { meltTempOverride: "-10°C", injectionSpeedOverride: "-10%" } },
  { id: "bolle_aria", label: "Bolle d'aria interne", rules: {
      // dynamic: increase backpressure proportionally to volume
      backPressureBar: (input: any) => {
        const vol = input.volumeCm3 || 5;
        const base = 10;
        return Math.min(80, base + Math.round(vol * 2));
      },
      holdingPressureOverride: "+20 bar"
    } as any
  },
  { id: "striature", label: "Striature", rules: { injectionSpeedOverride: "+10%", meltTempOverride: "+5°C" } },
  { id: "lucido_opaco", label: "Lucido opaco irregolare", rules: { meltTempOverride: "+5°C" } },
  { id: "sink_marks", label: "Segni d'affondamento (Sink Marks)", rules: {
      // dynamic: increase packing/holding pressure and cooling time based on area/volume
      apply: (input: any) => {
        const area = input.projAreaCm2 || 10;
        const vol = input.volumeCm3 || 5;
        const pct = Math.min(50, Math.max(10, Math.round((area / 10) * 5)));
        const extraCooling = Math.min(60, Math.round(vol * 2));
        return {
          packingPressureOverride: `+${pct}%`,
          holdingPressureOverride: `+${Math.round(pct * 1.2)}%`,
          coolingTimeOverride: `+${extraCooling}s`,
        };
      }
    } as any
  },
  { id: "rugosita", label: "Rugosità anomala", rules: { injectionSpeedOverride: "-10%" } },
  { id: "difetti_brillantezza", label: "Difetti di brillantezza", rules: { meltTempOverride: "+5°C" } },
  { id: "deformazioni", label: "Deformazioni / Imbarcamento (Warping)", rules: {
      // dynamic adjustment: reduce mold temperature and increase cooling time
      moldTemp: (input: any) => {
        const mat = input.material || {};
        const desired = (mat.moldMax || 70) - 10;
        return desired;
      },
      coolingTimeOverride: (input: any) => {
        const vol = input.volumeCm3 || 5;
        return `+${Math.min(60, Math.round(vol * 3))}s`;
      }
    } as any
  },
  { id: "ritiro", label: "Ritiro irregolare", rules: { holdingPressureOverride: "+10%" as any } },
  { id: "bave", label: "Bave / Fuoriuscite", rules: { injectionSpeedOverride: "-15%" } },
  { id: "giunzione_stamp", label: "Giunzione stampo non chiusa correttamente", rules: { clampForceTon: 0 as any } },
  { id: "sovrariscaldamento", label: "Sovrariscaldamento materiale", rules: { meltTempOverride: "-10°C" } },
  { id: "materiale_degradato", label: "Materiale degradato / bruciato", rules: { meltTempOverride: "-15°C" } },
  { id: "inclusioni", label: "Inclusioni / Contaminazioni", rules: { injectionSpeedOverride: "-10%" } },
  { id: "peso_non_conforme", label: "Peso non conforme", rules: { injectionSpeedOverride: "+10%" } },
  { id: "tolleranza", label: "Dimensioni fuori tolleranza", rules: { injectionSpeedOverride: "+10%" } },
  { id: "cold_slug", label: "Gelo / Cold Slug visibile", rules: { meltTempOverride: "+10°C" } },
  { id: "sfiato", label: "Difetti da sfiato insufficiente", rules: { holdingPressureOverride: "+30 bar" } },
  { id: "superficie_opaca", label: "Superficie opaca", rules: { meltTempOverride: "+5°C" } },
  { id: "superficie_lucida", label: "Superficie lucida anomala", rules: { meltTempOverride: "-5°C" } },
];

export default DEFECT_RULES;
