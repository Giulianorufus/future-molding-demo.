import React from "react";
import { suggestInjectionProfile, suggestHoldingProfile } from "@/lib/suggestInjectionProfile";

export function InjectionHoldingSuggestions({ analysis, selectedMaterial, press }) {
  if (!analysis || !selectedMaterial || !press?.modelId) return null;
  // buildSuggestions per temperature e peso
  const materiale = {
    code: selectedMaterial.code || selectedMaterial.id || "ABS_generic",
    meltRange: [220, 260],
    moldRange: [50, 80],
    viscosity: selectedMaterial.viscosita || "media",
    tipo: selectedMaterial.tipo || "ABS"
  };
  const cad = {
    volume: analysis.volume_cm3,
    thickness_min: analysis.thickness_mm,
    thickness_max: analysis.thickness_mm,
    thin_zones: false,
    long_runner: false,
    projectedArea_cm2: 0,
    cavities: 1,
  };
  const pressa = {
    brand: press.pressId || "Generic",
    screwDiam_mm: press.screwDiameter_mm || 40,
    Vdot_max: 200,
    Pmax: 1500,
    F_kN: 1000,
    zones: 5,
    runnerType: press.runnerType || "cold"
  };
  const base = require("@/lib/buildSuggestions").buildSuggestions({ cad, pressa, materiale });
  // Parametri per injection
  const injectionParams = {
    Vcar: analysis.volume_cm3,
    Pc: Math.max(3, analysis.volume_cm3 * 0.05),
    t_mm: analysis.thickness_mm,
    materiale: {
      tipo: selectedMaterial.tipo || "ABS",
      viscosita: selectedMaterial.viscosita || "media",
      shearSensitive: false,
    },
    Vdot_max: 200,
    Pmax: 1500,
  };
  const inj = suggestInjectionProfile(injectionParams);
  // Parametri per mantenimento
  const hold = suggestHoldingProfile({
    volume_cm3: analysis.volume_cm3,
    material: { name: selectedMaterial.name, viscosity: selectedMaterial.viscosita === "alta" ? 20 : selectedMaterial.viscosita === "media" ? 10 : 5 },
    pressSpecs: { maxInjectionPressure_bar: 1500 },
  });

  return (
    <div className="mt-6">
      <div className="font-semibold text-blue-700 mb-2">Suggerimenti Multi-Step</div>
      <div className="mb-2">
        <span className="font-bold">Iniezione:</span>
        <ul className="list-disc ml-5 text-sm">
          {inj.switchesCm3?.map((sw, i) => (
            <li key={i}>
              Step {i + 1}: Velocità <b>{inj.speedsCm3s[i]}</b> cm³/s, Pressione <b>{inj.pressuresBar[i]}</b> bar, Switch a <b>{sw}</b> cm³
            </li>
          ))}
        </ul>
        {inj.notes?.length > 0 && (
          <div className="text-xs text-slate-500 mt-2">{inj.notes.join(". ")}</div>
        )}
      </div>
      <div className="mb-2">
        <span className="font-bold">Mantenimento:</span>
        <ul className="list-disc ml-5 text-sm">
          {hold.map((step, i) => (
            <li key={i}>
              Step {i + 1}: Pressione <b>{Math.round(step.pressione)}</b> bar, Tempo <b>{Math.round(step.tempo_s)}</b> s ({Math.round(step.da_s)}–{Math.round(step.a_s)} s)
            </li>
          ))}
        </ul>
      </div>
      {/* Peso pezzo, tempo raffreddamento, termoregolazione */}
      {base && (
        <div className="mb-2">
          <span className="font-bold">Peso pezzo:</span> <b>{base.volumeCarica ? Math.round(base.volumeCarica * (selectedMaterial.density_g_cm3 || 1.2)) : "-"}</b> g<br />
          <span className="font-bold">Suggerimento termoregolazione:</span> <br />
          <span className="text-sm">Matrice: <b>{base.temperatures?.stampo ?? "-"}</b> °C, Punzone/ugello: <b>{typeof base.temperatures?.ugello === "number" ? base.temperatures.ugello + (pressa.runnerType === "hot" ? 10 : 0) : "-"}</b> °C {pressa.runnerType === "hot" ? <span className="text-orange-600">(hot runner: +10°C)</span> : null}</span><br />
          {/* Forza di chiusura stampo */}
          {(() => {
            try {
              const { estimateClampingFromCad } = require("@/lib/clampingForce");
              const area = cad.projectedArea_cm2 || 0;
              const cavities = cad.cavities || 1;
              const avgPressure = base.steps?.length ? (base.steps.map(s => s.pressureBar).reduce((a, b) => a + b, 0) / base.steps.length) : 800;
              if (area > 0) {
                const clamp = estimateClampingFromCad({ projectedArea_cm2: area, cavities, p_eff_bar: avgPressure });
                const available = pressa.F_kN;
                return <span className="text-sm">Forza di chiusura stampo: <b>{clamp.F_req_sic_kN}</b> kN (sicurezza)<br />
                  {clamp.F_req_sic_kN > available ? (
                    <span className="text-red-600 font-bold">Attenzione: la forza richiesta supera quella disponibile ({available} kN)!</span>
                  ) : (
                    <span className="text-green-700">OK: la forza disponibile ({available} kN) è sufficiente.</span>
                  )}
                </span>;
              }
            } catch {}
            return null;
          })()}
        </div>
      )}
      {/* Tempo raffreddamento: stima semplificata */}
      {analysis.thickness_mm && (
        <div className="mb-2">
          <span className="font-bold">Tempo raffreddamento stimato:</span> <b>{Math.round(0.055 * analysis.thickness_mm * analysis.thickness_mm)}</b> s
        </div>
      )}
    </div>
  );
}