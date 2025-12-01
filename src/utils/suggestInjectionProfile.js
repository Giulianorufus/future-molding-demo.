// utils/suggestInjectionProfile.js
import { getMaterialByCode, getViscosityFactor } from '../lib/materials.ts';

export function suggestInjectionProfile({
  Vcar,          // Volume di carica (cm³)
  Pc,            // cm³ residui = cuscino + margine
  t_mm,          // spessore medio (mm) - se non lo hai, metti 2.0
  materiale,     // { tipo: "ABS"|"PC"|"PP"|"PA-GF"|..., viscosita: "bassa|media|alta" }
  estetico=false,
  zoneSottili=false,
  longRunner=false,
  difettiStorico=[],   // es. ["striature","linee di flusso","jetting"]
  Vdot_max=200,        // limite macchina cm³/s
  Pmax=1800,           // limite bar
  cadAnalysis=null     // CAD analysis data from uploaded file
}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  
  // Get material data from internal database if available
  const materialData = getMaterialByCode(materiale?.tipo);
  
  // Use CAD analysis data if available
  let actualVcar = Number(Vcar) || 0;
  let actualThickness = Number(t_mm) || 2.0;
  let actualZoneSottili = zoneSottili;
  let actualLongRunner = longRunner;
  
  if (cadAnalysis) {
    actualVcar = cadAnalysis.volume || actualVcar;
    actualThickness = cadAnalysis.thickness_min || actualThickness;
    actualZoneSottili = cadAnalysis.thin_zones || actualZoneSottili;
    actualLongRunner = cadAnalysis.long_runner || actualLongRunner;
  }
  
  const Vfill = Math.max(0, actualVcar - (Number(Pc)||0));
  const Vdot_min = 10; // guard-rail

  // 1) n° tappe (deterministico) - now using CAD-derived values
  const hasFlow = difettiStorico.includes("striature") || difettiStorico.includes("linee di flusso") || difettiStorico.includes("jetting");
  let steps = 1;
  if (actualThickness <= 1.2 || (estetico && (materiale?.tipo === "PC" || (materiale?.tipo||"").includes("PA"))) || (actualLongRunner && hasFlow)) steps = 3;
  else if (actualThickness < 2.5 || estetico || actualZoneSottili || hasFlow) steps = 2;

  // 2) posizioni cambio (in cm³ residui dal Vfill)
  let switches = (steps === 1)
    ? [Pc]
    : (steps === 2 ? [0.70 * Vfill, Pc] : [0.50 * Vfill, 0.85 * Vfill, Pc]);
  switches = switches.map(x => Number((x||0).toFixed(2)));

  // 3) tempo target e velocità medie - using CAD thickness
  let k_t = actualThickness >= 2.5 ? 0.020 : (actualThickness <= 1.2 ? 0.040 : 0.030);
  if (estetico) k_t *= 1.3;
  const t_fill_target = Math.max(0.2, k_t * (Vfill / Math.max(0.5, actualThickness)));
  const Vdot_avg_raw = Vfill / t_fill_target;

  let speeds = (steps === 1)
    ? [Vdot_avg_raw]
    : (steps === 2 ? [1.1 * Vdot_avg_raw, 0.8 * Vdot_avg_raw] : [1.2 * Vdot_avg_raw, 1.0 * Vdot_avg_raw, 0.7 * Vdot_avg_raw]);

  // Apply material-specific corrections using database data
  let materialSpeedFactor = 1.0;
  let materialPressureFactor = 1.0;
  
  if (materialData) {
    const viscosityFactors = getViscosityFactor(materialData.MVR.value);
    materialSpeedFactor = viscosityFactors.speedFactor;
    materialPressureFactor = viscosityFactors.pressureFactor;
  } else {
    // Fallback to original logic if material not in database
    const viscAlta = ["alta"].includes(materiale?.viscosita) || materiale?.tipo === "PC" || (materiale?.tipo||"").includes("PA-GF");
    if (viscAlta) materialSpeedFactor = 0.9;
  }
  
  // Apply material corrections
  speeds = speeds.map(v => v * materialSpeedFactor);
  if (actualZoneSottili) speeds[0] = 1.1 * speeds[0];
  if (hasFlow) speeds = speeds.map(v => 0.9 * v);

  // clamp velocità
  speeds = speeds.map(v => Number(clamp(v, Vdot_min, Vdot_max).toFixed(1)));

  // 4) pressioni per tappa (stima +100 bar) - enhanced with material database
  const coeff = (() => {
    if (materialData) {
      // Use material-specific pressure coefficients based on type
      if (materialData.tipo === "amorf") return { a: 6, b: 60 };
      if (materialData.tipo === "semicristallino") return { a: 5, b: 50 };
      if (materialData.tipo === "elastomero") return { a: 4, b: 40 };
    }
    
    // Fallback to original logic
    const m = (materiale?.tipo||"").toUpperCase();
    if (m.includes("PC") || m.includes("PA-GF")) return { a: 7, b: 80 };
    if (m.includes("PP") || m.includes("PE"))   return { a: 4, b: 40 };
    return { a: 5, b: 50 }; // ABS/generico
  })();
  
  let pressures = speeds.map(v => {
    let basePressure = Math.round(coeff.a * v + coeff.b) + 100;
    if (materialData) {
      basePressure *= materialPressureFactor;
    }
    return Math.min(Pmax, Math.round(basePressure));
  });

  return {
    steps,
    switchesCm3: switches,
    speedsCm3s: speeds,
    pressuresBar: pressures,
    Vfill: Number(Vfill.toFixed(2)),
    cadDerived: {
      volume: actualVcar,
      thickness: actualThickness,
      thinZones: actualZoneSottili,
      longRunner: actualLongRunner
    }
  };
}