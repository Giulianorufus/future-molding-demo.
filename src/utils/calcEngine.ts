/**
 * Motore di calcolo "reale" basato su:
 * - Analisi 3D (volume, bbox, spessori, area, componenti)
 * - Profilo pressa (limiti cm³, cm³/s, kN)
 * - Materiale (range stampo + fattori viscosità/raffreddamento)
 * - Difetti selezionati (correzioni automatiche)
 *
 * Tutte le formule sono euristiche industriali pulite e conservative.
 */

import { getMachineProfile } from "@/lib/pressProfiles";

export type AnalysisData = {
  volume_cm3: number | null;
  area_cm2: number | null;
  bbox_mm: { x: number; y: number; z: number } | null;
  thickness_mm: { min: number; mean: number; max: number } | null;
  components: number | null;
};

export type InputData = {
  brand: string | null;
  model: string | null;
  material: string | null; // es. "PP", "ABS", "PC", "PA66 GF40", "PC/ABS"
  defects?: string[]; // elenco tipi difetto presenti (anche ripetuti)
};

export type CalcResult = {
  ok: boolean;
  params: {
    injectionSpeed_cc_s: number; // cm³/s
    switchover_cc: number; // cm³ (commutazione)
    packPressure_bar: number; // bar
    moldTemp_C_fixed: number; // °C
    moldTemp_C_mobile: number; // °C
    cooling_s: number; // s
    clamp_kN: number; // kN
    shot_cc: number; // cm³ (pezzo x cavità + fatt. canali)
    cushion_cc: number; // cm³
  };
  limits: {
    cappedInjectionSpeed?: boolean;
    cappedClamp?: boolean;
    overShot?: boolean;
  };
  notes: string[];
};

// Proprietà materiali (range stampo + fattori per velocità/raffreddamento)
type MaterialProfile = {
  moldTempRange: [number, number]; // °C
  viscosityFactor: number; // <1 viscoso/lento, >1 scorrevole/veloce
  coolingK: number; // costante per t_cool ≈ K * (spessore_max_mm)^2
};
const MATERIALS: Record<string, MaterialProfile> = {
  PP: { moldTempRange: [20, 40], viscosityFactor: 1.15, coolingK: 0.55 },
  ABS: { moldTempRange: [60, 80], viscosityFactor: 0.95, coolingK: 0.75 },
  PC: { moldTempRange: [80, 120], viscosityFactor: 0.85, coolingK: 0.85 },
  "PA66 GF40": { moldTempRange: [80, 100], viscosityFactor: 0.9, coolingK: 0.65 },
  "PC/ABS": { moldTempRange: [80, 100], viscosityFactor: 0.9, coolingK: 0.8 },
};

// Mappa difetti → correzioni
type Corrections = {
  speedMul?: number; // moltiplica velocità
  packMul?: number; // moltiplica pack
  coolingAddS?: number; // aggiunge secondi
  moldTempShift?: number; // +/- °C su target stampo
};
const DEFECT_FIX: Record<string, Corrections> = {
  "Riempimento incompleto": { speedMul: 1.1 },
  "Segni di ritiro": { packMul: 1.1, coolingAddS: 2 },
  Bave: { packMul: 0.9 },
  Bruciature: { speedMul: 0.9, moldTempShift: -10 },
  Jetting: { speedMul: 0.9 },
  "Linea di giunzione": { packMul: 1.05 },
  Imbarcamento: { coolingAddS: 2 },
  "Striature (umidità)": { moldTempShift: +5 },
  "Vuoti/Bolle": { packMul: 1.08 },
  "Graffi in estrazione": {}, // nulla sui parametri base
};

function getMaterialProfile(material: string | null): MaterialProfile {
  if (material && MATERIALS[material]) return MATERIALS[material];
  // fallback "ABS"
  return MATERIALS["ABS"];
}

export function calculateParams(input: InputData, a: AnalysisData): CalcResult {
  const notes: string[] = [];
  // Validazioni minime
  if (!a || !a.volume_cm3 || !a.bbox_mm || !a.thickness_mm) {
    throw new Error("Analisi 3D insufficiente: servono volume, bbox e spessori (usa STL/GLB).");
  }
  if (!input.brand || !input.model || !input.material) {
    throw new Error("Seleziona marca, modello e materiale.");
  }

  const mProf = getMachineProfile(input.brand, input.model);
  const mat = getMaterialProfile(input.material);

  // ---- Shot e cushion
  const cavities = Math.max(1, a.components ?? 1); // proxy cavità (se il file contiene tutte le cavità)
  const runnerFactor = 0.0; // per ora zero (non conosciamo i canali); puoi impostare 0.05..0.15 se serve
  const shot_cc = a.volume_cm3 * cavities * (1 + runnerFactor);
  let cushion_cc = Math.max(2, +(shot_cc * 0.05).toFixed(2)); // 5% o minimo 2 cm³

  // Switchover: quando restano in vite solo cushion
  let switchover_cc = +(Math.max(0.1, shot_cc - cushion_cc)).toFixed(2);

  // ---- Velocità iniezione (cm³/s)
  const tMin = a.thickness_mm.min;
  const tMean = a.thickness_mm.mean;
  let baseSpeed = 14; // base conservativa
  if (tMin < 1.0) baseSpeed = 18; // pezzo sottile → serve spingere
  else if (tMin > 3.0) baseSpeed = 12; // pezzo spesso → più lento

  baseSpeed *= mat.viscosityFactor; // materiale più/meno scorrevole

  // Limita per geometria (pezzo piccolo: evitare eccessi)
  if (shot_cc < 10) baseSpeed = Math.min(baseSpeed, 12);

  let injectionSpeed_cc_s = baseSpeed;

  // ---- Pack (bar)
  let packPressure_bar = 0;
  switch (input.material) {
    case "PP":
      packPressure_bar = 400;
      break;
    case "ABS":
      packPressure_bar = 600;
      break;
    case "PC":
      packPressure_bar = 700;
      break;
    case "PA66 GF40":
      packPressure_bar = 800;
      break;
    case "PC/ABS":
      packPressure_bar = 700;
      break;
    default:
      packPressure_bar = 600;
  }
  if (a.thickness_mm.max > 3) packPressure_bar *= 1.05; // zone spesse → leggero aumento
  packPressure_bar = Math.round(packPressure_bar);

  // ---- Cooling (s): K * (spessore_max_mm)^2 con min 6 s
  const coolK = mat.coolingK;
  let cooling_s = Math.max(6, +(coolK * Math.pow(a.thickness_mm.max, 2)).toFixed(1));

  // ---- Temperatura stampo: centro del range materiale
  const moldMid = Math.round((mat.moldTempRange[0] + mat.moldTempRange[1]) / 2);
  let moldTemp_C_fixed = moldMid;
  let moldTemp_C_mobile = moldMid;

  // ---- Clamp (kN): kN/cm² × area_proiettata(cm²)
  // Stima area proiettata con bbox (mm→cm): prudente
  const projArea_cm2 = (a.bbox_mm.x * a.bbox_mm.y) / 100; // (mm*mm)/100 = cm²
  let clamp_kN = projArea_cm2 * 0.45 * cavities; // 0.45 kN/cm²
  clamp_kN = Math.round(clamp_kN);

  // ---- Correzioni dai difetti (se presenti)
  const defectSet = new Set((input.defects ?? []).filter(Boolean));
  if (defectSet.size) notes.push(`Correzioni applicate per difetti: ${Array.from(defectSet).join(", ")}`);
  for (const d of defectSet) {
    const fx = DEFECT_FIX[d];
    if (!fx) continue;
    if (fx.speedMul) injectionSpeed_cc_s *= fx.speedMul;
    if (fx.packMul) packPressure_bar = Math.round(packPressure_bar * fx.packMul);
    if (fx.coolingAddS) cooling_s = +(cooling_s + fx.coolingAddS).toFixed(1);
    if (fx.moldTempShift) {
      moldTemp_C_fixed += fx.moldTempShift;
      moldTemp_C_mobile += fx.moldTempShift;
    }
  }

  // ---- Rispettare i limiti pressa
  const limits: CalcResult["limits"] = {};
  if (injectionSpeed_cc_s > mProf.maxInj_cc_s) {
    injectionSpeed_cc_s = mProf.maxInj_cc_s;
    limits.cappedInjectionSpeed = true;
    notes.push(`Velocità limitata al max macchina (${mProf.maxInj_cc_s} cm³/s).`);
  }
  if (shot_cc > mProf.maxShot_cc) {
    limits.overShot = true;
    notes.push(`ATTENZIONE: shot ${shot_cc.toFixed(1)} cm³ > max macchina (${mProf.maxShot_cc} cm³).`);
  }
  if (clamp_kN > mProf.clamp_kN) {
    clamp_kN = mProf.clamp_kN;
    limits.cappedClamp = true;
    notes.push(`Forza chiusura limitata al max macchina (${mProf.clamp_kN} kN).`);
  }

  // Arrotonda output principali
  injectionSpeed_cc_s = +injectionSpeed_cc_s.toFixed(1);
  packPressure_bar = Math.round(packPressure_bar);
  cooling_s = +cooling_s.toFixed(1);
  clamp_kN = Math.round(clamp_kN);

  return {
    ok: true,
    params: {
      injectionSpeed_cc_s,
      switchover_cc,
      packPressure_bar,
      moldTemp_C_fixed,
      moldTemp_C_mobile,
      cooling_s,
      clamp_kN,
      shot_cc: +shot_cc.toFixed(2),
      cushion_cc: +cushion_cc.toFixed(2),
    },
    limits,
    notes,
  };
}

