/* eslint-disable react-refresh/only-export-components */
import React from "react";

// ---- LOGICA ----
export type RunnerSystem =
  | "camera_calda"
  | "fredda_singolo_punto"
  | "fredda_bilanciata_2_4"
  | "fredda_bilanciata_>4";

export interface WeightInputs {
  pieceVolume_cm3: number;        // Volume pezzo singolo (cm³)
  density_g_cm3: number;          // Densità materiale (g/cm³)
  cavities: number;               // Numero cavità
  runnerSystem: RunnerSystem;     // Sistema alimentazione
  coldRunnerVolume_cm3?: number;  // Volume canali noto (cm³)
  runnerFactorOverride?: number;  // % personalizzata canali
}

export interface WeightResult {
  pieceWeight_g_single: number;
  pieceWeight_g_total: number;
  runnerWeight_g: number;
  shotWeight_g: number;
  injectedVolume_cm3: number;
  notes: string[];
}

function defaultRunnerFactor(system: RunnerSystem): number {
  switch (system) {
    case "camera_calda": return 0.01;
    case "fredda_singolo_punto": return 0.35;
    case "fredda_bilanciata_2_4": return 0.25;
    case "fredda_bilanciata_>4": return 0.20;
    default: return 0.25;
  }
}

export function calcWeights(inp: WeightInputs): WeightResult {
  const notes: string[] = [];

  const pieceWeight_g_single = inp.pieceVolume_cm3 * inp.density_g_cm3;
  const pieceWeight_g_total = pieceWeight_g_single * inp.cavities;

  let runnerWeight_g = 0;
  if (typeof inp.coldRunnerVolume_cm3 === "number") {
    runnerWeight_g = inp.coldRunnerVolume_cm3 * inp.density_g_cm3;
    notes.push("Canali calcolati da volume canali fornito.");
  } else {
    const factor =
      typeof inp.runnerFactorOverride === "number"
        ? inp.runnerFactorOverride
        : defaultRunnerFactor(inp.runnerSystem);
    runnerWeight_g = pieceWeight_g_total * factor;
    notes.push(
      typeof inp.runnerFactorOverride === "number"
        ? `Fattore canali personalizzato: ${(factor * 100).toFixed(1)}%.`
        : `Fattore canali da tabella: ${(factor * 100).toFixed(1)}% (${inp.runnerSystem}).`
    );
  }

  const shotWeight_g = pieceWeight_g_total + runnerWeight_g;
  const injectedVolume_cm3 = shotWeight_g / inp.density_g_cm3;

  return {
    pieceWeight_g_single,
    pieceWeight_g_total,
    runnerWeight_g,
    shotWeight_g,
    injectedVolume_cm3,
    notes,
  };
}

// ---- COMPONENTE UI ----
type Props = {
  pieceVolume_cm3: number;
  density_g_cm3: number;
  cavities: number;
  runnerSystem: RunnerSystem;
  coldRunnerVolume_cm3?: number;
  runnerFactorOverride?: number;
  visible?: boolean;
};

const WeightBlock: React.FC<Props> = (p) => {
  if (!p.visible) return null;

  const r = calcWeights({
    pieceVolume_cm3: p.pieceVolume_cm3,
    density_g_cm3: p.density_g_cm3,
    cavities: p.cavities,
    runnerSystem: p.runnerSystem,
    coldRunnerVolume_cm3: p.coldRunnerVolume_cm3,
    runnerFactorOverride: p.runnerFactorOverride,
  });

  const fmt = (x: number, d = 2) => x.toFixed(d);

  return (
    <div className="card" style={{ padding: 12 }}>
      <h3 style={{ margin: 0 }}>Peso pezzo &amp; stampata</h3>
      <div style={{ marginTop: 8 }}>
        <div>â€¢ Peso pezzo (singolo): <strong>{fmt(r.pieceWeight_g_single)} g</strong></div>
        <div>â€¢ Peso pezzi totali (x{p.cavities}): <strong>{fmt(r.pieceWeight_g_total)} g</strong></div>
        <div>â€¢ Materozza/Canali per ciclo: <strong>{fmt(r.runnerWeight_g)} g</strong></div>
        <div>â€¢ Peso stampata (shot): <strong>{fmt(r.shotWeight_g)} g</strong></div>
        <div>â€¢ Volume iniezione totale: <strong>{fmt(r.injectedVolume_cm3)} cmÂ³</strong></div>
      </div>
      {r.notes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          {r.notes.map((n, i) => <div key={i}>Nota: {n}</div>)}
        </div>
      )}
    </div>
  );
};

export default WeightBlock;
