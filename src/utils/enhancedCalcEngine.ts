/* ========================= FUTURE MOLDING – BLOCCO "SOTTO BANCO" =========================
   Algoritmi 1–6: Reologia, Gate-Freeze/Pack, Clamp, Compatibilità Pressa,
                   Plastificazione vs Raffreddamento, Profili Velocità + Switch V→P
   Non richiede dipendenze. Safe defaults. Nessuna modifica alla UI necessaria.
=========================================================================================== */

///////////////////////////
// 0) Tipi & Costanti
///////////////////////////
export type MaterialKey = 'PP'|'ABS'|'PA66_GF40'|'PC';

type RheologyCrossWLF = {
  // Cross-WLF semplificato
  D1: number;        // Pa·s
  A1: number;        // –
  A2: number;        // K
  Tstar: number;     // K
  tauStar: number;   // Pa
  n: number;         // –
  rho: number;       // g/cm3 (a T stampaggio)
  alphaTherm: number;// diffusività termica ~ mm2/s per cooling model (user friendly)
  Tg?: number;       // °C per amorfi; opzionale
  Tm?: number;       // °C per semi-cristallini; opzionale
};

export type MachineLimits = {
  model: string;
  screwDiameter_mm: number;
  maxInjectionPressure_bar: number;
  maxInjectionSpeed_cm3s: number; // portata volumetrica equivalente
  plasticizingRate_kg_h: number;
  shotStroke_cm3: number; // volume utile max
};

export type GateType = 'tab'|'edge'|'pin'|'fan'|'submarine';

export type EnhancedInputs = {
  material: MaterialKey;
  moldTemp_C: number;       // °C
  meltTemp_C: number;       // °C
  ambient_C?: number;       // °C (fallback 23)
  partThickness_mm: number; // spessore critico
  gate: {
    type: GateType;
    thickness_mm?: number; // se assente, usa 0.8*partThickness
    width_mm?: number;     // per tab/edge/fan
    diameter_mm?: number;  // per pin/submarine
  };
  flowLength_mm?: number;   // lunghezza di flusso media (fallback 80mm)
  runnerVolume_cm3?: number;// se cold runner
  hotRunner?: boolean;      // default false
  shotVolume_cm3: number;   // volume pezzo + eventuale materozza
  targetCushion_cm3?: number; // se assente, stimato
  injSpeed_cm3s: number;    // velocità d’iniezione (portata volumetrica)
  machine: MachineLimits;
  ejectTemp_C?: number;     // target di estrazione; fallback materiale-dipendente
  waterTemp_C?: number;     // per cooling heuristic; fallback a 25–30°C
  multiCavity?: boolean;
  ventingQuality?: 'poor'|'normal'|'good';
  materialDry?: boolean;    // per PA/PC/PMMA
  regrindPct?: number;      // 0–50%
};

export type EnhancedOutput = {
  viscosity_PaS: number;
  shearRate_s: number;
  injPressure_bar: number;
  packProfile: {p_bar:number; t_s:number}[]; // 3 stadi
  gateFreeze_s: number;
  clampForce_kN: number;
  coolingTime_s: number;
  plasticizingTime_s: number;
  vToPSwitch_cm3: number;      // volume alla commutazione (residuo)
  velocityProfile: { fillFracTo:number; injSpeed_cm3s:number }[]; // 3 step
  warnings: string[];
  notes: string[];
};

const MAT: Record<MaterialKey, RheologyCrossWLF> = {
  PP: {
    D1: 1.5e5, A1: 8.86, A2: 101.6, Tstar: 373.15, tauStar: 50000, n: 0.25,
    rho: 0.74, alphaTherm: 0.12, Tm: 165
  },
  ABS: {
    D1: 3.0e5, A1: 12.5, A2: 50, Tstar: 373.15, tauStar: 65000, n: 0.22,
    rho: 1.03, alphaTherm: 0.10, Tg: 105
  },
  PA66_GF40: {
    D1: 2.2e5, A1: 10.5, A2: 65, Tstar: 373.15, tauStar: 80000, n: 0.20,
    rho: 1.38, alphaTherm: 0.09, Tm: 260
  },
  PC: {
    D1: 4.0e5, A1: 13.5, A2: 45, Tstar: 423.15, tauStar: 70000, n: 0.23,
    rho: 1.18, alphaTherm: 0.085, Tg: 150
  }
};

///////////////////////////
// 1) Reologia Cross-WLF lite
///////////////////////////
function eta0_PaS(mat: RheologyCrossWLF, T_C: number): number {
  const T = T_C + 273.15;
  const {D1, A1, A2, Tstar} = mat;
  const num = -A1 * (T - Tstar);
  const den = A2 + (T - Tstar);
  const log10 = num / den;
  const eta0 = D1 * Math.pow(10, log10); // Pa·s
  return Math.max(eta0, 500); // floor anti-outlier
}

function etaCross_PaS(mat: RheologyCrossWLF, T_C: number, gamma_s: number): number {
  const e0 = eta0_PaS(mat, T_C);
  const X = (e0 * Math.max(gamma_s, 1)) / mat.tauStar;
  return e0 / Math.pow(1 + Math.pow(X, (1 - mat.n)), 1);
}

///////////////////////////
// 2) Shear rate al gate (rettangolare o circolare) + Q
///////////////////////////
function estimateGateDims(gate: EnhancedInputs['gate'], partTh_mm: number): {b_mm:number; h_mm:number; d_mm:number|null} {
  const h = gate.thickness_mm ?? Math.max(0.6, 0.8 * partTh_mm);
  const b = gate.width_mm ?? Math.min(2.0 * partTh_mm, 8);
  if (gate.type === 'pin' || gate.type === 'submarine') {
    const d = gate.diameter_mm ?? Math.max(0.6, 0.7 * partTh_mm);
    return {b_mm: b, h_mm: h, d_mm: d};
  }
  return {b_mm: b, h_mm: h, d_mm: null};
}

function shearRate_s(gate: EnhancedInputs['gate'], partTh_mm: number, Q_cm3s: number): number {
  const g = estimateGateDims(gate, partTh_mm);
  const Q_mm3s = Q_cm3s * 1000; // 1 cm3 = 1000 mm3
  if (g.d_mm) {
    // circolare: γ̇ ≈ 32 Q / (π d^3)
    return (32 * Q_mm3s) / (Math.PI * Math.pow(g.d_mm, 3));
  }
  // rettangolare: γ̇ ≈ 6 Q / (b h^2)
  return (6 * Q_mm3s) / (g.b_mm * Math.pow(g.h_mm, 2));
}

///////////////////////////
// 3) Pressione di iniezione "lite"
///////////////////////////
// ΔP ~ k_geom * η(γ̇,T) * γ̇   con k_geom basata su spessore e lunghezza di flusso
function injectionPressure_bar(eta_PaS: number, gamma_s: number, partTh_mm: number, flowLen_mm: number, hotRunner:boolean): number {
  const kGeom = (flowLen_mm / Math.max(partTh_mm, 0.5)) * (hotRunner ? 0.9 : 1.0);
  const dP_Pa = 0.035 * kGeom * eta_PaS * Math.max(gamma_s, 1); // coeff. tarabile
  const bar = dP_Pa / 1e5;
  return Math.min(Math.max(bar, 300), 2200); // clamp 300–2200 bar
}

///////////////////////////
// 4) Gate freeze time → profilo pack (3 stadi)
///////////////////////////
function gateFreeze_s(mat: RheologyCrossWLF, gate: EnhancedInputs['gate'], partTh_mm: number, moldTemp_C: number, meltTemp_C: number): number {
  const g = estimateGateDims(gate, partTh_mm);
  const h = (g.d_mm ?? g.h_mm); // spessore termico dominante al gate [mm]
  const alpha = mat.alphaTherm; // mm2/s
  const Tmelt = meltTemp_C;
  const Tmold = moldTemp_C;
  const TeffFreeze = mat.Tm ?? (mat.Tg ? mat.Tg + 30 : Tmold + 60);
  const term = Math.max((Tmelt - Tmold) / Math.max((TeffFreeze - Tmold), 10), 1.2);
  const t = (Math.pow(h, 2) / (Math.PI * Math.PI * Math.max(alpha, 0.06))) * Math.log(term);
  return Math.min(Math.max(t, 1.2), 12 * Math.pow(h/1, 2)); // 1.2s min, cap grossolano
}

function packProfileFromGF(Pinj_bar: number, gf_s: number, material: MaterialKey, hotRunner:boolean): {p_bar:number; t_s:number}[] {
  // base ratio: hot runner richiede meno pack
  const base = hotRunner ? 0.70 : 0.80;
  const stiff = (material === 'PA66_GF40') ? 1.05 : 1.0;
  const P1 = Math.round(base * 1.00 * stiff * Pinj_bar);
  const P2 = Math.round(base * 0.85 * stiff * Pinj_bar);
  const P3 = Math.round(base * 0.70 * stiff * Pinj_bar);
  return [
    {p_bar: clampBar(P1), t_s: Math.max(0.3, 0.45 * gf_s)},
    {p_bar: clampBar(P2), t_s: Math.max(0.2, 0.35 * gf_s)},
    {p_bar: clampBar(P3), t_s: Math.max(0.2, 0.20 * gf_s)},
  ];
}
function clampBar(x:number){ return Math.min(Math.max(x, 80), 1400); }

///////////////////////////
// 5) Cooling time (semplice ma fisico) + plastificazione
///////////////////////////
function coolingTime_s(material: MaterialKey, partTh_mm:number, moldTemp_C:number, ejectTemp_C?:number): number {
  const m = MAT[material];
  const Tmold = moldTemp_C;
  const Teject = ejectTemp_C ?? (m.Tg ? m.Tg - 10 : (m.Tm ? m.Tm - 80 : 80));
  const Tmelt = (m.Tm ? m.Tm + 40 : 250); // fallback
  const alpha = Math.max(m.alphaTherm, 0.06); // mm2/s
  const term = Math.max((Tmelt - Tmold) / Math.max((Teject - Tmold), 8), 1.5);
  const t = (Math.pow(partTh_mm,2) / (Math.PI*Math.PI*alpha)) * Math.log(term);
  // minimo pratico
  return Math.min(Math.max(t, 6), 60 * Math.pow(partTh_mm/5, 2));
}

function plasticizingTime_s(material: MaterialKey, shotVol_cm3:number, meltTemp_C:number, machine: MachineLimits, regrindPct=0): number {
  const rho = MAT[material].rho * (1 - 0.001*regrindPct); // regrind riduce densità effettiva un filo
  const mass_kg = (shotVol_cm3 * rho) / 1000; // g → kg
  const rate = Math.max(machine.plasticizingRate_kg_h, 2); // safety
  return (mass_kg / rate) * 3600;
}

///////////////////////////
// 6) Profili velocità multi-step + V→P su volume residuo reale
///////////////////////////
function velocityProfile(inputs: EnhancedInputs): { fillFracTo:number; injSpeed_cm3s:number }[] {
  const vent = inputs.ventingQuality ?? 'normal';
  const t = inputs.partThickness_mm;
  const base = inputs.injSpeed_cm3s;
  const kVent = vent === 'poor' ? 0.85 : vent === 'good' ? 1.1 : 1.0;
  const kTh = t > 3 ? 1.1 : t < 1 ? 0.9 : 1.0;
  const v1 = Math.round(base * 1.00 * kVent * kTh);
  const v2 = Math.round(base * 0.75 * kVent);
  const v3 = Math.round(base * 0.45);
  return [
    { fillFracTo: 0.60, injSpeed_cm3s: v1 },
    { fillFracTo: 0.90, injSpeed_cm3s: v2 },
    { fillFracTo: 0.98, injSpeed_cm3s: v3 },
  ];
}

function vToPSwitch_cm3(inputs: EnhancedInputs, cushion_cm3:number): number {
  const shot = inputs.shotVolume_cm3;
  const runner = inputs.hotRunner ? 0 : (inputs.runnerVolume_cm3 ?? Math.max(0.06*shot, 0));
  const residual = cushion_cm3 + 0.5 * runner; // lascia ~50% runner liquido a switch
  // V→P quando mancano al plunger questi cm3:
  return Math.max(shot - (residual), 0.5);
}

///////////////////////////
// 7) Compatibilità pressa
///////////////////////////
function machineWarnings(inputs: EnhancedInputs, Pinj_bar:number, cooling_s:number, plast_s:number, cushion_cm3:number): string[] {
  const w: string[] = [];
  const m = inputs.machine;
  const shot = inputs.shotVolume_cm3;
  // Stroke
  if (shot + cushion_cm3 > m.shotStroke_cm3*0.95) {
    w.push(`Volume richiesto ${Math.round(shot+cushion_cm3)} cm³ ≈ stroke utile (${m.shotStroke_cm3} cm³). Rischio fondo-corsa.`);
  }
  // Pressione
  if (Pinj_bar > m.maxInjectionPressure_bar*0.95) {
    w.push(`Pressione iniezione stimata ${Math.round(Pinj_bar)} bar vicino/oltre al limite pressa (${m.maxInjectionPressure_bar} bar).`);
  }
  // Velocità
  if (inputs.injSpeed_cm3s > m.maxInjectionSpeed_cm3s*0.95) {
    w.push(`Velocità iniezione richiesta ${Math.round(inputs.injSpeed_cm3s)} cm³/s vicino/oltre limite macchina (${m.maxInjectionSpeed_cm3s} cm³/s).`);
  }
  // Plastificazione vs raffreddamento
  if (plast_s > cooling_s) {
    w.push(`Tempo di carica vite (${plast_s.toFixed(1)} s) > tempo di raffreddamento (${cooling_s.toFixed(1)} s). Ciclo non sostenibile.`);
  }
  // Drying
  if ((inputs.material==='PA66_GF40'||inputs.material==='PC') && inputs.materialDry===false) {
    w.push(`Materiale ${inputs.material} non asciutto → viscosità instabile, parametri ballerini.`);
  }
  // Multi-cavità
  if (inputs.multiCavity && !inputs.hotRunner) {
    w.push(`Multi-impronta con cold runner: riduci aggressività (velocità/pack) o verifica bilanciamento colate.`);
  }
  return w;
}

///////////////////////////
// 8) Clamp force (kN)
///////////////////////////
function clampForce_kN(aprojected_cm2:number, pack_bar:number): number {
  // P_cavità ~ 0.7 * p_pack (stima prudente)
  const Pcav_bar = 0.7 * pack_bar;
  const kN = aprojected_cm2 * Pcav_bar * 0.1 * 1.15; // (bar*cm2*0.1=kN), +15% margine
  return Math.round(kN);
}

///////////////////////////
// 9) Helper vari
///////////////////////////
function defaultCushion_cm3(shot_cm3:number){ return Math.max(0.03*shot_cm3, 0.8); }
function defaultFlowLen_mm(t_mm:number){ return Math.max(80, 20*t_mm); }
function approxProjectedArea_cm2(shot_cm3:number, t_mm:number){
  const t_cm = Math.max(t_mm, 0.8) / 10;
  return Math.max(shot_cm3 / t_cm, 10);
}

///////////////////////////
// 10) API principale – da chiamare "sotto banco"
///////////////////////////
export function computeEnhancedParams(inp: EnhancedInputs): EnhancedOutput {
  const mat = MAT[inp.material];
  const warnings: string[] = [];
  const notes: string[] = [];

  const flowL = inp.flowLength_mm ?? defaultFlowLen_mm(inp.partThickness_mm);
  const cushion = inp.targetCushion_cm3 ?? defaultCushion_cm3(inp.shotVolume_cm3);
  const gamma = shearRate_s(inp.gate, inp.partThickness_mm, inp.injSpeed_cm3s);
  const eta = etaCross_PaS(mat, inp.meltTemp_C, gamma);

  // Pressione di iniezione
  const Pinj = injectionPressure_bar(eta, gamma, inp.partThickness_mm, flowL, !!inp.hotRunner);

  // Gate freeze e pack profile
  const tGF = gateFreeze_s(mat, inp.gate, inp.partThickness_mm, inp.moldTemp_C, inp.meltTemp_C);
  const pack = packProfileFromGF(Pinj, tGF, inp.material, !!inp.hotRunner);

  // Cooling & Plastificazione
  const tCool = coolingTime_s(inp.material, inp.partThickness_mm, inp.moldTemp_C, inp.ejectTemp_C);
  const tPlast = plasticizingTime_s(inp.material, inp.shotVolume_cm3, inp.meltTemp_C, inp.machine, inp.regrindPct ?? 0);

  // Profili velocità e V→P
  const vProf = velocityProfile(inp);
  const vToP = vToPSwitch_cm3(inp, cushion);

  // Clamp force: usa pack primo stadio come riferimento
  const aProj = approxProjectedArea_cm2(inp.shotVolume_cm3, inp.partThickness_mm);
  const clamp_kN = clampForce_kN(aProj, pack[0].p_bar);

  // Warnings macchina
  warnings.push(...machineWarnings(inp, Pinj, tCool, tPlast, cushion));

  // Note utili
  if (inp.regrindPct && inp.regrindPct > 20) {
    notes.push(`Regrind ${inp.regrindPct}%: attendersi incremento variabilità viscosità → rivedere pack.`);
  }
  if (!inp.hotRunner && (inp.runnerVolume_cm3 ?? 0) === 0) {
    notes.push(`Cold runner non specificato: stimato ${Math.round(0.06*inp.shotVolume_cm3)} cm³ nel calcolo dello switch.`);
  }
  if (inp.ventingQuality === 'poor') {
    notes.push(`Sfiati scarsi: profilo velocità conservativo negli ultimi 10–40% di riempimento.`);
  }

  return {
    viscosity_PaS: Math.round(eta),
    shearRate_s: Math.round(gamma),
    injPressure_bar: Math.round(Pinj),
    packProfile: pack,
    gateFreeze_s: Number(tGF.toFixed(1)),
    clampForce_kN: clamp_kN,
    coolingTime_s: Math.round(tCool),
    plasticizingTime_s: Math.round(tPlast),
    vToPSwitch_cm3: Number(vToP.toFixed(2)),
    velocityProfile: vProf,
    warnings,
    notes,
  };
}

/* ========================= COME USARLA (esempio non invasivo) ============================
import { computeEnhancedParams } from '@/utils/calcEngine';

// Nel punto dove hai già inputs consolidati:
const enhanced = computeEnhancedParams({
  material: 'PA66_GF40',
  moldTemp_C: 90,
  meltTemp_C: 285,
  partThickness_mm: 2.5,
  gate: { type:'pin', diameter_mm:1.2 },
  flowLength_mm: 120,
  hotRunner: false,
  runnerVolume_cm3: 6,
  shotVolume_cm3: 38,
  targetCushion_cm3: 1.2,
  injSpeed_cm3s: 40,
  machine: {
    model: 'Generic 100T / Ø25',
    screwDiameter_mm: 25,
    maxInjectionPressure_bar: 2200,
    maxInjectionSpeed_cm3s: 70,
    plasticizingRate_kg_h: 8,
    shotStroke_cm3: 60
  },
  ventingQuality: 'normal',
  materialDry: true,
  regrindPct: 10,
  multiCavity: false
});

// Poi puoi:
// - usare enhanced.vToPSwitch_cm3 come punto di commutazione reale
// - usare enhanced.packProfile per i 3 stadi di post-pressione
// - mostrare/registrare enhanced.warnings come bandierine (senza cambiare UI)
// - verificare sostenibilità ciclo: enhanced.plasticizingTime_s ≤ enhanced.coolingTime_s
========================================================================================== */
