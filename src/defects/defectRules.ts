export type DefectId = "short_shot" | "flash" | "sink" | "warpage";

export type DefectSeverity = "low" | "medium" | "high";

export type DefectFix = {
  delta?: Partial<{
    injectionSpeed_pct: number;
    injectionPressure_pct: number;
    packPressure_pct: number;
    packTime_pct: number;
    meltTemp_C: number;
    moldTemp_C: number;
    switchOver_pct: number;
    backPressure_pct: number;
  }>;
  notes: string[];
};

const sev = (s: DefectSeverity) => (s === "low" ? 1 : s === "medium" ? 2 : 3);

// Pure function: deterministically map defect + severity -> suggested partial patch
export function applyDefectFix(defect: DefectId, severity: DefectSeverity): DefectFix {
  const k = sev(severity);

  switch (defect) {
    case "short_shot":
      return {
        delta: {
          injectionSpeed_pct: 5 * k,
          injectionPressure_pct: 5 * k,
          packPressure_pct: 3 * k,
          packTime_pct: 5 * k,
          switchOver_pct: 2 * k,
          meltTemp_C: 2 * k,
        },
        notes: [
          "Aumenta velocità/pressione per completare il riempimento.",
          "Ritarda leggermente la commutazione VP e aumenta pack/time se necessario.",
          "Se resta: verifica sfiati e contropressione, e che non sia volume insufficiente.",
        ],
      };

    case "flash":
      return {
        delta: {
          injectionSpeed_pct: -5 * k,
          injectionPressure_pct: -5 * k,
          packPressure_pct: -5 * k,
          packTime_pct: -5 * k,
          meltTemp_C: -2 * k,
          moldTemp_C: -1 * k,
          switchOver_pct: -2 * k,
        },
        notes: [
          "Riduci picchi di pressione/velocità e pressione/tempo di pack.",
          "Se persiste: verifica forza di chiusura e parallelismo stampo.",
        ],
      };

    case "sink":
      return {
        delta: {
          packPressure_pct: 5 * k,
          packTime_pct: 8 * k,
          meltTemp_C: -1 * k,
          moldTemp_C: -1 * k,
        },
        notes: [
          "Aumenta pack pressure/time per compensare ritiro.",
          "Se persiste: valutare spessore, gate, e raffreddamento localizzato.",
        ],
      };

    case "warpage":
      return {
        delta: {
          moldTemp_C: -2 * k,
          packTime_pct: 5 * k,
          injectionSpeed_pct: -2 * k,
        },
        notes: [
          "Riduci gradienti termici e rendi il riempimento meno aggressivo.",
          "Se persiste: bilanciamento canali, tempi raffreddamento e orientamento fibre (se caricato).",
        ],
      };

    default:
      return { delta: {}, notes: ["Nessuna regola disponibile per questo difetto."] };
  }
}

export default applyDefectFix;
