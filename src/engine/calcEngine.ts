import { PressProfile } from "./pressProfiles";
import { MaterialInfo } from "./materialData";
import { recommendedClampForceTon } from "./clampForce";
import { parseOverride } from "../utils/overrides";
import { enforceSafety } from "./safetyChecks";
import { useDrawingStore } from "../stores/drawingStore";
import type { GeometrySummary, PackResult, VPResult, TonnageResult, TemperatureSuggestion, CalcSuggestions } from "./calcTypes";
import type { CalcInput as UserCalcInput, CalcOutput as UserCalcOutput, TemperatureOutput as UserTemperatureOutput } from "./calcTypes";
import {
  calcInjectionSpeed as hCalcInjectionSpeed,
  calcInjectionPressure as hCalcInjectionPressure,
  calcFillTime as hCalcFillTime,
  calcVP as hCalcVP,
  calcPack as hCalcPack,
  calcCoolingTime as hCalcCoolingTime,
  calcTonnellaggio as hCalcTonnellaggio,
  calcTemperatures as hCalcTemperatures,
} from "./calcHelpers";

export interface CalcInput {
  material: MaterialInfo;
  press: PressProfile;
  screwDiameter: number; // mm
  projAreaCm2?: number; // cm²
  volumeCm3?: number; // cm³
  moldTemp?: number | string;
  injectionSpeedOverride?: string | number;
  meltTempOverride?: string | number;
  holdingPressureOverride?: string | number;
  clampForceOverride?: string | number;
}

export interface CalcResult {
  meltTempZones: number[];
  moldTemp: number;
  injectionSpeedCm3s: number;
  holdingPressureBar: number;
  backPressureBar: number;
  screwRpm: number;
  coolingTimeSec: number;
  clampForceTon: number;
  warnings?: string[];

  // volumes & times
  shotVolumeCm3?: number;
  pieceVolumeCm3?: number;
  runnerVolumeCm3?: number;
  vpVolumeCm3?: number;
  packTimeSec?: number;
  plastificationTimeSec?: number;

  // extended
  suggestedInjectionSpeedCm3s?: number;
  computedInjectionPressure_bar?: number;
  fillTime_s?: number;
  vpSwitchVolumeCm3?: number;
  vpComputed_cm3?: number;
  packPressureBar?: number;
  packTimeComputedSec?: number;
  coolingFromThicknessSec?: number;
  requiredTonnage_t?: number;
  pressAdequate?: boolean;
  temperatureSuggestion?: { suggestedMeltTempC?: number; suggestedMoldTempC?: number };
  suggestions?: string[];

  // backwards compatible short names
  velIniezione?: number;
  pressioneIniezione?: number;
  fillTime?: number;
  vp?: number;
  packPressione?: number;
  packTempo?: number;
  coolingTime?: number;
  tonnellaggio?: number;
  temperature?: Record<string, number> | Record<string, string>;
}

export function calculateParameters(input: CalcInput): CalcResult {
  const { material, press, screwDiameter } = input;
  // Recupero geometria dalla fonte corretta: drawingStore
  const ds = useDrawingStore.getState();

  const geometry: GeometrySummary = {
    volumeCm3: (ds as any).volumeCm3 ?? null,
    areaCm2: (ds as any).areaCm2 ?? null,
    spessoreMedio: (ds as any).spessoreMedio ?? null,
    boundingBox: (ds as any).boundingBox ?? null,
  } as any;

  const meltMid = (material.meltMin + material.meltMax) / 2;
  const delta = 8;
  const meltTempZones = [meltMid - 2 * delta, meltMid - delta, meltMid, meltMid + delta].map(t => Math.round(t));

  const moldTemp = Math.round(
    material.crystalline
      ? material.moldMin + (material.moldMax - material.moldMin) * 0.75
      : material.moldMin + (material.moldMax - material.moldMin) * 0.5
  );

  let finalMoldTemp = moldTemp;
  if ((input as any).moldTemp !== undefined && (input as any).moldTemp !== null) {
    const m = Number((input as any).moldTemp);
    if (!Number.isNaN(m)) finalMoldTemp = Math.round(m);
  }

  let baseSpeed: number;
  switch (material.viscosity) {
    case "low": baseSpeed = 80; break;
    case "medium": baseSpeed = 60; break;
    case "high":
    default: baseSpeed = 45; break;
  }

  const screwFactor = screwDiameter <= 18 ? 0.8 : screwDiameter <= 22 ? 0.9 : screwDiameter <= 25 ? 1.0 : 1.05;
  let injectionSpeedCm3s = Math.round(baseSpeed * screwFactor);

  const family = material.family;
  let holdingPressureBar = (family === "PP" || family === "PA66GF") ? 600 : 750;
  let backPressureBar = material.viscosity === "high" ? 80 : material.viscosity === "medium" ? 60 : 40;
  let screwRpm = screwDiameter <= 18 ? 250 : screwDiameter <= 22 ? 220 : screwDiameter <= 25 ? 200 : 180;
  let coolingTimeSec = material.crystalline ? 22 : 18;

  const projArea = input.projAreaCm2;
  let clampForceTon = typeof projArea === "number" && projArea > 0 ? recommendedClampForceTon(projArea, material.family) : Math.round((press.clampForceTon || 0) * 0.7);

  function parsePercentOrNumber(value: string | number) { return parseOverride(value as any); }

  if (input.injectionSpeedOverride) {
    const parsed = parsePercentOrNumber(input.injectionSpeedOverride);
    if (parsed) {
      if (parsed.type === 'percent') injectionSpeedCm3s = Math.round(injectionSpeedCm3s * (1 + parsed.val / 100));
      else if (parsed.type === 'absolute') injectionSpeedCm3s = Math.round(parsed.val);
      else if (parsed.type === 'add') injectionSpeedCm3s = Math.round(injectionSpeedCm3s + parsed.val);
    }
  }

  if (input.meltTempOverride) {
    const parsed = parsePercentOrNumber(input.meltTempOverride);
    if (parsed) {
      if (parsed.type === 'add' || parsed.type === 'absolute') {
        const add = parsed.val;
        for (let i = 0; i < meltTempZones.length; i++) meltTempZones[i] = Math.round(meltTempZones[i] + add);
      } else if (parsed.type === 'percent') {
        const pct = parsed.val / 100;
        for (let i = 0; i < meltTempZones.length; i++) meltTempZones[i] = Math.round(meltTempZones[i] * (1 + pct));
      }
    }
  }

  if (input.holdingPressureOverride) {
    const parsed = parsePercentOrNumber(input.holdingPressureOverride);
    if (parsed) {
      if (parsed.type === 'add') holdingPressureBar = Math.round(holdingPressureBar + parsed.val);
      else if (parsed.type === 'percent') holdingPressureBar = Math.round(holdingPressureBar * (1 + parsed.val / 100));
      else if (parsed.type === 'absolute') holdingPressureBar = Math.round(parsed.val);
    }
  }

  if (input.clampForceOverride) {
    const parsed = parsePercentOrNumber(input.clampForceOverride);
    if (parsed) {
      if (parsed.type === 'add') clampForceTon = Math.round(clampForceTon + parsed.val);
      else if (parsed.type === 'percent') clampForceTon = Math.round(clampForceTon * (1 + parsed.val / 100));
      else if (parsed.type === 'absolute') clampForceTon = Math.round(parsed.val);
    } else if (typeof input.clampForceOverride === 'number') clampForceTon = Math.round(input.clampForceOverride as number);
  }

  const pieceVol = typeof input.volumeCm3 === 'number' && input.volumeCm3 > 0 ? input.volumeCm3 : (typeof input.projAreaCm2 === 'number' && input.projAreaCm2 > 0 ? Math.round(input.projAreaCm2 * 0.2) : 10);
  const runnerVol = Math.max(1, Math.round(pieceVol * 0.05));
  const totalShot = Math.round(pieceVol + runnerVol);

  const warnings: string[] = [];
  const pm: any = press as any;
  if (pm?.maxSpeedCm3s && injectionSpeedCm3s > pm.maxSpeedCm3s) warnings.push(`Velocità iniezione ${injectionSpeedCm3s} cm³/s > max pressa ${pm.maxSpeedCm3s} cm³/s`);
  if (pm?.maxPressureBar && holdingPressureBar > pm.maxPressureBar) warnings.push(`Pressione tenuta ${holdingPressureBar} bar > max pressa ${pm.maxPressureBar} bar`);
  if (pm?.shotVolumeCm3 && totalShot > pm.shotVolumeCm3) warnings.push(`Shot stimato ${totalShot} cm³ > capacità vite pressa ${pm.shotVolumeCm3} cm³`);
  if (clampForceTon > (press.clampForceTon || 0)) warnings.push(`Forza di chiusura ${clampForceTon} ton > capacità pressa ${press.clampForceTon} ton`);

  const vpVolume = Math.max(1, Math.round(pieceVol * 0.95));
  const packTime = Math.max(1, Math.round((pieceVol || 1) * 0.5));
  const plastTime = Math.max(1, Math.round(totalShot / Math.max(1, injectionSpeedCm3s)));

  const thickness = geometry?.spessoreMedio_mm ?? null;
  const projAreaFromStore = geometry?.areaProiettata_cm2 ?? input.projAreaCm2;
  const pieceVolFromStore = geometry?.volumePezzo_cm3 ?? input.volumeCm3 ?? pieceVol;

  const suggestedInjectionSpeedCm3s = (thickness ? Math.round(injectionSpeedCm3s * Math.max(0.8, Math.min(1.4, 1 + (1.5 - Math.log10(thickness + 1)) * 0.08))) : injectionSpeedCm3s);
  const computedInjectionPressure_bar = Math.round(Math.min(1500, ((family === 'PP' || family === 'PA66GF') ? 50 : 60) * Math.sqrt((projAreaFromStore || 10))));
  const fillTime_s = Math.max(0.1, Math.round(((pieceVolFromStore || pieceVol) / Math.max(1, suggestedInjectionSpeedCm3s)) * 100) / 100);
  const vpRes: VPResult = { vpVolumeCm3: vpVolume, switchVolumeCm3: Math.max(1, Math.round((pieceVolFromStore || pieceVol) * 0.6)) };
  const packRes: PackResult = { packPressureBar: Math.round((material as any).density_g_cm3 ?? 1 * Math.max(20, Math.min(200, (pieceVolFromStore || pieceVol) * 0.5))), packTimeSec: packTime };
  const coolingFromThickness = thickness ? Math.round((material.crystalline ? 22 : 18) * (1 + Math.pow((thickness / 3), 1.4) * 0.25)) : (material.crystalline ? 22 : 18);
  const tonnage = (() => { const area = (projAreaFromStore || projArea || 10); const required = Math.max(1, Math.round(area * 0.01 * 100) / 100); const pressAdequate = (press.clampForceTon || 0) >= required; return { requiredTonnage_t: required, pressAdequate }; })();
  const tempSug: TemperatureSuggestion = { suggestedMeltTempC: material.meltMin, suggestedMoldTempC: finalMoldTemp };
  const suggestions: CalcSuggestions = { notes: warnings.slice(0, 3) };

  const geom_spess = (geometry as any)?.spessoreMedio ?? (geometry as any)?.spessoreMedio_mm ?? null;
  const geom_area = (geometry as any)?.areaProiettata ?? (geometry as any)?.areaProiettata_cm2 ?? input.projAreaCm2 ?? projArea;
  const geom_vol = (geometry as any)?.volumeTotale ?? (geometry as any)?.volumePezzo_cm3 ?? input.volumeCm3 ?? pieceVol;

  const velIniezione = hCalcInjectionSpeed(Number(geom_spess) || 0, material as any);
  const pressioneIniezione = hCalcInjectionPressure(Number(geom_area) || 0, velIniezione, material as any);
  const fillTime = hCalcFillTime(Number(geom_vol) || 0, velIniezione);
  const vp = hCalcVP(Number(geom_vol) || 0, material as any);
  const pack = hCalcPack(material as any, Number(geom_vol) || 0);
  const cooling = hCalcCoolingTime(Number(geom_spess) || 0);
  const tonnellaggio = hCalcTonnellaggio(Number(geom_area) || 0, pressioneIniezione);
  const temperature = hCalcTemperatures(material as any);

  return {
    meltTempZones,
    moldTemp: finalMoldTemp,
    injectionSpeedCm3s,
    holdingPressureBar,
    backPressureBar,
    screwRpm,
    coolingTimeSec,
    clampForceTon,
    warnings,
    shotVolumeCm3: totalShot,
    pieceVolumeCm3: pieceVol,
    runnerVolumeCm3: runnerVol,
    vpVolumeCm3: vpVolume,
    packTimeSec: packTime,
    plastificationTimeSec: plastTime,
    suggestedInjectionSpeedCm3s,
    computedInjectionPressure_bar,
    fillTime_s,
    vpSwitchVolumeCm3: vpRes.switchVolumeCm3,
    vpComputed_cm3: vpRes.vpVolumeCm3,
    packPressureBar: packRes.packPressureBar,
    packTimeComputedSec: packRes.packTimeSec,
    coolingFromThicknessSec: coolingFromThickness,
    requiredTonnage_t: tonnage.requiredTonnage_t,
    pressAdequate: tonnage.pressAdequate,
    temperatureSuggestion: tempSug,
    suggestions: suggestions.notes,
    velIniezione,
    pressioneIniezione,
    fillTime,
    vp,
    packPressione: (pack as any).packPressureBar ?? 0,
    packTempo: (pack as any).packTimeSec ?? 0,
    coolingTime: cooling,
    tonnellaggio,
    temperature,
  };
}

// Profili Iniezione (3 step)
export function buildInjectionProfile(vel: number): { step1: number; step2: number; step3: number } {
  return {
    step1: Math.round(vel * 0.55),
    step2: Math.round(vel * 1.0),
    step3: Math.round(vel * 0.7),
  };
}

export function buildPressureProfile(basePressure: number): { step1: number; step2: number; step3: number } {
  return {
    step1: Math.round(basePressure * 0.6),
    step2: Math.round(basePressure * 1.0),
    step3: Math.round(basePressure * 0.8),
  };
}

export function buildPackProfile(packPress: number): { step1: number; step2: number; step3: number } {
  return {
    step1: Math.round(packPress * 1.0),
    step2: Math.round(packPress * 0.75),
    step3: Math.round(packPress * 0.5),
  };
}

// Wrapper italiano: mappa l'input utente alla forma interna e applica calculateParameters
export function calcolaParametri(input: UserCalcInput): UserCalcOutput {
  const machine: any = (input as any).machine ?? {};
  const mat: any = (input as any).material ?? {};

  const pressProfile: PressProfile = {
    id: machine.id ?? 'unknown',
    brand: (String(machine.nome || '').toLowerCase().includes('engel')) ? 'engel' : 'arburg',
    label: machine.nome,
    clampForceTon: Math.round(((machine.tonnellaggio_kN ?? 0) / 9.80665) || 0),
    screwDiameters: [machine.screwDiameter_mm ?? 0],
    shotVolumeCm3: machine.maxShotVolume_cm3,
    maxSpeedCm3s: machine.maxInjectionSpeed_cm3_s,
    maxPressureBar: machine.maxInjectionPressure_bar,
    maxScrewRpm: undefined,
    safetyMarginPercent: 0,
  };

  const viscosityBand: 'low' | 'medium' | 'high' = (mat.viscosityFactor ?? 1) <= 0.9 ? 'low' : ((mat.viscosityFactor ?? 1) <= 1.15 ? 'medium' : 'high');
  const family = (String(mat.id || '').toUpperCase().includes('PA')) ? 'PA66GF' : (String(mat.id || '').toUpperCase().includes('PP') ? 'PP' : 'PCABS');

  const materialInfo: any = {
    id: String(mat.id || '').toLowerCase(),
    name: mat.nome,
    family,
    meltMin: mat.tempCylStart_C ?? (mat.meltMin ?? 200),
    meltMax: mat.tempCylEnd_C ?? (mat.meltMax ?? 240),
    moldMin: mat.tempMold_C ?? (mat.moldMin ?? 40),
    moldMax: mat.tempMold_C ?? (mat.moldMax ?? 80),
    viscosity: viscosityBand,
    crystalline: family === 'PP' || family === 'PA66GF',
    density_g_cm3: mat.density_g_cm3,
  };

  const geometry = (input as any).geometry ?? {};

  const internal = calculateParameters({ material: materialInfo, press: pressProfile, screwDiameter: machine.screwDiameter_mm ?? 0, projAreaCm2: geometry.areaProiettata_cm2, volumeCm3: geometry.volumePezzo_cm3 });

  const tempAny: any = internal.temperature ?? internal.temperatureSuggestion ?? {};
  const z1 = tempAny.z1 ?? internal.meltTempZones?.[0] ?? 0;
  const z2 = tempAny.z2 ?? internal.meltTempZones?.[1] ?? z1;
  const z3 = tempAny.z3 ?? internal.meltTempZones?.[2] ?? z2;
  const z4 = tempAny.z4 ?? internal.meltTempZones?.[3] ?? z3;
  const stampo = internal.moldTemp ?? (tempAny.suggestedMoldTempC ?? tempAny.stampo ?? 0);
  const ugello = tempAny.ugello ?? (tempAny.suggestedMeltTempC ?? z4);

  const tempOut: UserTemperatureOutput = { z1: Math.round(z1), z2: Math.round(z2), z3: Math.round(z3), z4: Math.round(z4), stampo: Math.round(stampo), ugello: Math.round(ugello) };

  const out: any = {
    volumePezzo: geometry.volumePezzo_cm3,
    volumeMaterozza: geometry.volumeMaterozza_cm3,
    volumeTotale: geometry.volumeTotale_cm3,
    areaProiettata: geometry.areaProiettata_cm2,
    spessoreMedio: geometry.spessoreMedio_mm,

    velIniezione: internal.velIniezione ?? internal.injectionSpeedCm3s ?? internal.suggestedInjectionSpeedCm3s,
    pressioneIniezione: internal.pressioneIniezione ?? internal.computedInjectionPressure_bar ?? internal.holdingPressureBar,
    fillTime: internal.fillTime ?? internal.fillTime_s,

    vp: internal.vp ?? internal.vpComputed_cm3 ?? internal.vpVolumeCm3,

    packPressione: internal.packPressione ?? internal.packPressureBar ?? internal.packPressureBar,
    packTempo: internal.packTempo ?? internal.packTimeComputedSec ?? internal.packTimeSec,

    coolingTime: internal.coolingTime ?? internal.coolingFromThicknessSec ?? internal.coolingTimeSec,

    velocitaVite: internal.screwRpm,
    contropressione: internal.backPressureBar,
    tempoDosatura: internal.plastificationTimeSec,

    tonnellaggio: internal.tonnellaggio ?? internal.requiredTonnage_t ?? 0,
    tonnellaggioPressa: machine.tonnellaggio_kN,

    temperature: tempOut,

    suggerimenti: internal.suggestions ?? internal.suggestions ?? [],
  };

  (out as any).profiloIniezione = buildInjectionProfile(Number(out.velIniezione ?? 0));
  (out as any).profiloPressione = buildPressureProfile(Number(out.pressioneIniezione ?? 0));
  (out as any).profiloPack = buildPackProfile(Number(out.packPressione ?? 0));

  // separa suggerimenti dal resto per applicare il safety layer
  const { suggerimenti, ...base } = out as any;

  const raw: UserCalcOutput = {
    ...base,
    suggerimenti: suggerimenti ?? [],
  } as UserCalcOutput;

  // Applicazione layer di sicurezza
  const safe = enforceSafety(input as any, raw as any) as UserCalcOutput;

  return safe;
}

export async function computeCalcEngineHash() {
  try {
    const src = calculateParameters.toString();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sha256Hex } = require('./integrity');
    return await sha256Hex(src);
  } catch (_) {
    return '';
  }
}

