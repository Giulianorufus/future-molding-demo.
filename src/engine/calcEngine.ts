import { PressProfile } from "./pressProfiles";
import { MaterialInfo } from "./materialData";
import { recommendedClampForceTon } from "./clampForce";
import { computeClampForce } from "../lib/clampForce";
import { evaluateClampCapacity } from "../lib/clampCapacity";
import { materialCatalog, getMaterialInput } from "../data/materialCatalog";
import type { MaterialProfile } from "@/types/material";
import { ARBURG_PRESS_CATALOG } from "../data/arburgPressCatalog";
import { materialEffects } from "../lib/calc/materialEffects";
import { resolveMaterialOrFallback } from "../data/materialLibrary";
import { applyPressLimits } from "../lib/pressLimits";
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
  cavityCount?: number;
  totalPartsVolumeCm3?: number;
  projectedAreaTotalCm2?: number;
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

  // minimal process profile types (optional)
  injectionProfile?: ProcessProfile;
  packingProfile?: ProcessProfile;
  // switchover as percent or absolute (use numeric value)
  switchover?: Switchover;
  // legacy accessor kept for compatibility
  switchover_volumePercent?: Switchover;
}

export type StageValue = number;

export interface ProcessStage {
  step?: number;
  // common fields used by the UI
  speed_cm3_s?: number;
  pressure_bar?: number;
  time_s?: number;
  endBy?: { kind?: string; value?: number };
  label?: string;
}

export interface ProcessProfile {
  steps: ProcessStage[];
}

export type Switchover = number;

export type CalculationResultWithProfiles = CalcResult & Partial<{
  injectionProfile: ProcessProfile;
  packingProfile: ProcessProfile;
  switchover: Switchover;
  switchover_volumePercent: Switchover;
}>;

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
  // Compute material effects deterministically from typed catalog (do not rely on pre-attached legacy fields)
  let fxWarnings: string[] = [];
  let fxAssumptions: string[] = [];
  let fxMultipliers: { pressure?: number; flow?: number; cooling?: number } | null = null;
  try {
    // prefer caller-provided legacy `_materialEffects` when present (backwards compatibility)
    const legacyFx = (material as any)?._materialEffects ?? null;
    if (legacyFx) {
      fxMultipliers = legacyFx.multipliers ?? null;
      fxWarnings = Array.isArray(legacyFx.warnings) ? legacyFx.warnings.slice() : [];
      fxAssumptions = Array.isArray(legacyFx.assumptions) ? legacyFx.assumptions.slice() : [];
    } else {
      const typed = getMaterialById(String(material.id || '').toLowerCase());
      const fx = materialEffects(typed as any || null);
      if (fx) {
        fxMultipliers = fx.multipliers ?? null;
        fxWarnings = Array.isArray(fx.warnings) ? fx.warnings.slice() : [];
        fxAssumptions = Array.isArray(fx.assumptions) ? fx.assumptions.slice() : [];
      }
    }
    if (fxMultipliers) {
      injectionSpeedCm3s = Math.round(injectionSpeedCm3s * (fxMultipliers.flow ?? 1));
      coolingTimeSec = Math.round(coolingTimeSec * (fxMultipliers.cooling ?? 1));
    }
  } catch (_) {
    // non-blocking
  }

  // Mold configuration is intentionally separate from single-part CAD geometry.
  // Use totals only for machine sizing / shot / clamp calculations.
  const cavityCount = Math.max(1, Math.floor(Number((ds as any).cavityCount) || 1));
  const cavityCountConfirmed = Boolean((ds as any).cavityCountConfirmed);
  const feedSystem = ((ds as any).feedSystem ?? 'unknown') as 'unknown' | 'hot' | 'cold';
  const configuredRunnerVol = typeof (ds as any).runnerVolumeCm3 === 'number' ? Math.max(0, (ds as any).runnerVolumeCm3) : null;
  const configuredRunnerArea = typeof (ds as any).runnerProjectedAreaCm2 === 'number' ? Math.max(0, (ds as any).runnerProjectedAreaCm2) : 0;
  const singlePartArea = typeof input.projAreaCm2 === 'number' && input.projAreaCm2 > 0
    ? input.projAreaCm2
    : (typeof (ds as any).surfaceCm2 === 'number' ? (ds as any).surfaceCm2 : undefined);
  const projArea = typeof singlePartArea === 'number'
    ? singlePartArea * cavityCount + (feedSystem === 'cold' ? configuredRunnerArea : 0)
    : undefined;
  const effectivePress: any = press ?? (input as any).machine ?? {};
  const clampBaseTon = effectivePress.clampForceTon ?? (effectivePress.tonnellaggio_kN ? Math.round(effectivePress.tonnellaggio_kN / 9.80665) : 0);
  // If projected area is unavailable we cannot derive a physical clamp force from
  // geometry. Keep a conservative non-zero provisional value so consumers never
  // interpret "unknown area" as "0 t required"; the warning below keeps it provisional.
  let clampForceTon = typeof projArea === "number" && projArea > 0
    ? recommendedClampForceTon(projArea, material.family)
    : Math.max(1, Math.round((clampBaseTon || 0) * 0.7));

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

  // Prepare placeholders for optional g/cm²-based clamp evaluation (we'll merge into `result` later)
  let __cf_for_clamp: any = null;
  let __cap_for_clamp: any = null;
  let __clamp_local_warnings: string[] = [];
  try {
    const area_cm2 = (typeof projArea === "number" && projArea > 0) ? projArea : undefined;
    const cavity_bar = ((input as any)?.tunedCavityPressure_bar as number | undefined) ?? ((input as any)?.cavityPressure_bar as number | undefined);

    if (area_cm2 && typeof cavity_bar === 'number' && cavity_bar > 0) {
      const cf = computeClampForce({ projectedArea_cm2: area_cm2, cavityPressure_bar: cavity_bar, safetyFactor: 1.1 });

      // round ton for legacy clampForceTon
      clampForceTon = Math.round(cf.clampForceRequired_ton);

      // compute press available kN (try different keys)
      const pressClamp_kN = (effectivePress as any)?.clampForce_kN ?? ((effectivePress as any)?.clampForceTon ? (effectivePress as any).clampForceTon * 9.80665 : 0);

      const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: pressClamp_kN || 0 });

      __cf_for_clamp = cf;
      __cap_for_clamp = cap;

      if (cap.status === "borderline") {
        __clamp_local_warnings.push(`Forza chiusura borderline: ${cap.utilization_pct.toFixed(1)}% della capacità pressa`);
      } else if (cap.status === "fail") {
        __clamp_local_warnings.push(`Forza chiusura insufficiente: richiesto ${cf.clampForceRequired_ton.toFixed(1)} ton > capacità pressa`);
      }
    }
  } catch (_) {
    // non-blocking: keep existing clampForceTon
  }

  const pieceVol = typeof input.volumeCm3 === 'number' && input.volumeCm3 > 0
    ? input.volumeCm3
    : (typeof (ds as any).volumeCm3 === 'number' && (ds as any).volumeCm3 > 0
      ? (ds as any).volumeCm3
      : (typeof singlePartArea === 'number' && singlePartArea > 0 ? Math.round(singlePartArea * 0.2) : 10));
  const totalPartsVol = pieceVol * cavityCount;
  // No invented 5% runner. Hot runner contributes no cold-runner waste here;
  // cold runner uses only the operator-provided value; unknown stays provisional.
  const runnerVol = feedSystem === 'cold' ? (configuredRunnerVol ?? 0) : 0;
  const totalShot = Math.round((totalPartsVol + runnerVol) * 100) / 100;
  
  const warnings: string[] = [];
  if (!(typeof projArea === 'number' && projArea > 0)) warnings.push('Area proiettata non disponibile: forza di chiusura provvisoria');
  if (!cavityCountConfirmed) warnings.push('Numero cavità non confermato: dose e forza di chiusura sono provvisorie');
  if (feedSystem === 'unknown') warnings.push('Sistema di alimentazione non noto: dose e forza di chiusura sono provvisorie');
  if (feedSystem === 'cold' && configuredRunnerVol === null) warnings.push('Volume materozza/canali non inserito: dose calcolata sui soli pezzi');
    const ep: any = effectivePress as any;
    const maxSpeed = ep?.maxInjectionSpeed_cm3_s ?? ep?.maxInjectionSpeed_cm3s ?? ep?.maxSpeedCm3s ?? ep?.maxSpeed_cm3s ?? ep?.maxSpeedCm3s;
    if (maxSpeed && injectionSpeedCm3s > maxSpeed) warnings.push(`Velocità iniezione ${injectionSpeedCm3s} cm³/s > max pressa ${maxSpeed} cm³/s`);
    const maxPressure = ep?.maxInjectionPressure_bar ?? ep?.maxPressureBar ?? ep?.maxPressure_bar;
    if (maxPressure && holdingPressureBar > maxPressure) warnings.push(`Pressione tenuta ${holdingPressureBar} bar > max pressa ${maxPressure} bar`);
    const shotCap = ep?.maxShotVolume_cm3 ?? ep?.shotVolumeCm3 ?? ep?.maxShotVolumeCm3;
    if (shotCap && totalShot > shotCap) warnings.push(`Shot stimato ${totalShot} cm³ > capacità vite pressa ${shotCap} cm³`);
    if (clampForceTon > (ep?.clampForceTon || 0)) warnings.push(`Forza di chiusura ${clampForceTon} ton > capacità pressa ${ep?.clampForceTon} ton`);

  // Apply pressure multiplier (after holdingPressureBar initialization and overrides)
  try {
    if (fxMultipliers && typeof fxMultipliers.pressure === 'number') {
      holdingPressureBar = Math.round((holdingPressureBar || 0) * (fxMultipliers.pressure ?? 1));
    }
  } catch (_) {}

  // prepare helper for stable dedupe (we'll merge material fx warnings after press limits)
  const pushUnique = (target: string[], items?: string[]) => {
    if (!Array.isArray(items)) return;
    for (const it of items) {
      if (!it) continue;
      if (!target.includes(it)) target.push(it);
    }
  };

  // suggestions will be computed from the final warnings later

  const vpVolume = Math.max(1, Math.round(pieceVol * 0.95));
  const packTime = Math.max(1, Math.round((pieceVol || 1) * 0.5));
  const plastTime = Math.max(1, Math.round(totalShot / Math.max(1, injectionSpeedCm3s)));

  const thickness = geometry?.spessoreMedio_mm ?? null;
  const projAreaFromStore = geometry?.areaProiettata_cm2 ?? input.projAreaCm2;
  const pieceVolFromStore = geometry?.volumePezzo_cm3 ?? input.volumeCm3 ?? pieceVol;

  let suggestedInjectionSpeedCm3s = (thickness ? Math.round(injectionSpeedCm3s * Math.max(0.8, Math.min(1.4, 1 + (1.5 - Math.log10(thickness + 1)) * 0.08))) : injectionSpeedCm3s);
  let computedInjectionPressure_bar = Math.round(Math.min(1500, ((family === 'PP' || family === 'PA66GF') ? 50 : 60) * Math.sqrt((projAreaFromStore || 10))));
  let fillTime_s = Math.max(0.1, Math.round(((pieceVolFromStore || pieceVol) / Math.max(1, suggestedInjectionSpeedCm3s)) * 100) / 100);

  // --- Apply press max flow guardrail: compute required flow and clamp to press maxFlow if needed ---
  try {
    const shotVol = (pieceVolFromStore || pieceVol) || 0;
    const requiredFlow_cm3_s = shotVol / Math.max(1e-6, fillTime_s);
    const maxFlow = (effectivePress as any)?.maxInjectionSpeed_cm3_s ?? (effectivePress as any)?.maxInjectionSpeed_cm3s ?? (effectivePress as any)?.maxSpeedCm3s ?? (effectivePress as any)?.maxSpeed_cm3s ?? undefined;
    if (typeof maxFlow === 'number' && Number.isFinite(maxFlow) && (requiredFlow_cm3_s > maxFlow || suggestedInjectionSpeedCm3s > maxFlow || injectionSpeedCm3s > maxFlow)) {
      const cappedFlow = maxFlow;
      // put the machine-cap warning first so it appears in top suggestions
      warnings.unshift(`Limited by press maxInjectionFlow (${cappedFlow} cm³/s)`);

      // adjust fill time to match capped flow
      fillTime_s = Math.max(0.01, Math.round((shotVol / cappedFlow) * 100) / 100);

      // adjust suggested injection speed to the capped flow
      suggestedInjectionSpeedCm3s = cappedFlow;

      // if we have a screw diameter, convert capped flow to screw linear speed and rpm
      const sd = Number(screwDiameter || (input as any).screwDiameter || 0) || 0;
      if (sd > 0) {
        const screwArea_mm2 = Math.PI * (sd * sd) / 4; // mm^2
        const screwLinear_mm_s = (cappedFlow * 1000) / Math.max(1e-6, screwArea_mm2); // mm3/s -> mm/s
        const newRpm = Math.round((screwLinear_mm_s * 60) / (Math.PI * sd));
        // replace screwRpm with the capped value if it's lower
        if (typeof newRpm === 'number' && Number.isFinite(newRpm)) screwRpm = newRpm;
      }
    }
  } catch (e) {
    // non-blocking: keep original values on error
  }
  // apply pressure multiplier to computed injection pressure if available
  try {
    if (fxMultipliers && typeof fxMultipliers.pressure === 'number' && typeof computedInjectionPressure_bar === 'number') {
      computedInjectionPressure_bar = Math.round(computedInjectionPressure_bar * (fxMultipliers.pressure ?? 1));
    }
  } catch (_) {}
  
  const vpRes: VPResult = { vpVolumeCm3: vpVolume, switchVolumeCm3: Math.max(1, Math.round((pieceVolFromStore || pieceVol) * 0.6)) };
  const packRes: PackResult = { packPressureBar: Math.round((material as any).density_g_cm3 ?? 1 * Math.max(20, Math.min(200, (pieceVolFromStore || pieceVol) * 0.5))), packTimeSec: packTime };
  const coolingFromThickness = thickness ? Math.round((material.crystalline ? 22 : 18) * (1 + Math.pow((thickness / 3), 1.4) * 0.25)) : (material.crystalline ? 22 : 18);
  const tonnage = (() => { const area = (projAreaFromStore || projArea || 10); const required = Math.max(1, Math.round(area * 0.01 * 100) / 100); const pressAdequate = (press?.clampForceTon || 0) >= required; return { requiredTonnage_t: required, pressAdequate }; })();
  const tempSug: TemperatureSuggestion = { suggestedMeltTempC: material.meltMin, suggestedMoldTempC: finalMoldTemp };
  const suggestions: CalcSuggestions = { notes: warnings.slice(0, 3) };

  const geom_spess = (geometry as any)?.spessoreMedio ?? (geometry as any)?.spessoreMedio_mm ?? null;
  const geom_area = (geometry as any)?.areaProiettata ?? (geometry as any)?.areaProiettata_cm2 ?? input.projAreaCm2 ?? projArea;
  const geom_vol = (geometry as any)?.volumeTotale ?? (geometry as any)?.volumePezzo_cm3 ?? input.volumeCm3 ?? pieceVol;

  let velIniezione = hCalcInjectionSpeed(Number(geom_spess) || 0, material as any);
  // clamp computed velocity to suggested/capped injection speed if applied
  try {
    if (typeof suggestedInjectionSpeedCm3s === 'number' && Number.isFinite(suggestedInjectionSpeedCm3s)) {
      velIniezione = Math.min(velIniezione, suggestedInjectionSpeedCm3s);
    }
  } catch (_) {
    // ignore
  }
  const pressioneIniezione = hCalcInjectionPressure(Number(geom_area) || 0, velIniezione, material as any);
  const fillTime = hCalcFillTime(Number(geom_vol) || 0, velIniezione);
  const vp = hCalcVP(Number(geom_vol) || 0, material as any);
  const pack = hCalcPack(material as any, Number(geom_vol) || 0);
  const cooling = hCalcCoolingTime(Number(geom_spess) || 0);
  const tonnellaggio = hCalcTonnellaggio(Number(geom_area) || 0, pressioneIniezione);
  const temperature = hCalcTemperatures(material as any);

  const result: any = {
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
    cavityCount,
    totalPartsVolumeCm3: totalPartsVol,
    projectedAreaTotalCm2: projArea,
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
  // Merge any computed g/cm² clamp info (calculated earlier) into result/warnings
  try {
    if (__cf_for_clamp) {
      result.sources = { ...(result.sources ?? {}), clampModel: "g_cm2" };
      (result as any).clampPressureRequired_g_cm2 = __cf_for_clamp.clampPressureRequired_g_cm2;
      (result as any).clampUtilization_pct = __cap_for_clamp?.utilization_pct;
      result.warnings = Array.isArray(result.warnings) ? result.warnings : (result.warnings ?? []);
      if (__clamp_local_warnings.length) result.warnings.push(...__clamp_local_warnings);
    }
  } catch (_) {
    // non-blocking
  }
  // italian alias for callers/tests that expect it
  result.suggerimenti = suggestions.notes;
  // --- Apply press limits (clamp calculated params to press capabilities) ---
  try {
    const pressLimitsRes = applyPressLimits(result, effectivePress as any);
    const added = pressLimitsRes.warningsAdded || [];
    const clampedFields = pressLimitsRes.clampedFields || [];
    const appliedCorrections = pressLimitsRes.appliedCorrections || [];
    if (added.length) {
      result.warnings = Array.from(new Set([...(result.warnings ?? []), ...added]));
    }
    if (appliedCorrections.length) {
      result.appliedCorrections = result.appliedCorrections ?? [];
      result.appliedCorrections.push(...appliedCorrections);
    }
    if (clampedFields.length) {
      result.assumptions = Array.from(new Set([...(result.assumptions ?? []), 'Applied press limits clamp']));
      result.sources = { ...(result.sources ?? {}), clampApplied: true };
    }
  } catch (e) {
    // best-effort: do not break calculation flow
  }

  // Merge material fx warnings/assumptions after press limits. Keep machine-limit
  // diagnostics ahead of material diagnostics: consumers use this order to show
  // hard machine constraints before process advice.
  try {
    const existingWarnings = (result.warnings ?? []).map(String);
    const machineWarnings = existingWarnings.filter((s: string) => /limit|clamp|max|press.*max/i.test(s));
    const otherWarnings = existingWarnings.filter((s: string) => !/limit|clamp|max|press.*max/i.test(s));
    result.warnings = Array.from(new Set([...machineWarnings, ...otherWarnings]));
    pushUnique(result.warnings, fxWarnings);
    // also include material assumptions in warnings (legacy behavior expects them merged)
    pushUnique(result.warnings, fxAssumptions);
    // keep assumptions list too for downstream consumers
    result.assumptions = Array.from(new Set([...(result.assumptions ?? []), ...fxAssumptions]));
  } catch (_) {}
  return result as CalcResult;
}

// helper per recuperare materiale dal catalogo (punto unico di verità)
export function getMaterialById(id?: string | null): MaterialProfile | null {
  if (!id) return null;
  const pid = String(id).toLowerCase();
  return materialCatalog.find((m) => String(m.id).toLowerCase() === pid) ?? null;
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

  // If caller passed only a material id, resolve from catalog (fallback to ABS)
  const providedMatId = String((mat && mat.id) || (input as any).materialId || '').toLowerCase();
  try {
    const resolveInput = providedMatId || String((input as any).materialId || (mat && mat.id) || '').toLowerCase();
    const { material: resolvedMat, assumptions: matAssumptions } = resolveMaterialOrFallback(resolveInput || undefined);
    if (resolvedMat) {
      // map typed MaterialProfile to legacy material shape used elsewhere
      mat.id = resolvedMat.id;
      mat.nome = (resolvedMat as any).name ?? resolvedMat.id;
      mat.tempCylStart_C = (resolvedMat as any).meltTemp_C?.min ?? (resolvedMat as any).meltMin ?? null;
      mat.tempCylEnd_C = (resolvedMat as any).meltTemp_C?.max ?? (resolvedMat as any).meltMax ?? null;
      mat.tempMold_C = (resolvedMat as any).moldTemp_C?.typical ?? (resolvedMat as any).moldMin ?? null;
      mat.density_g_cm3 = (resolvedMat as any).density_g_cm3 ?? 1.0;
      // derive a simple viscosityFactor baseline from factors.flow (invert: lower flow => higher viscosity factor)
      mat.viscosityFactor = (resolvedMat as any).factors?.flow ?? 1;
      mat.viscosity = (mat.viscosityFactor <= 0.85) ? 'low' : (mat.viscosityFactor <= 1.1) ? 'medium' : 'high';
      mat.crystalline = /(PA|PBT|PPS)/i.test(resolvedMat.id);

      // attach computed material effects early (legacy compatibility) so calculateParameters will use them
      try {
        const fx = materialEffects(resolvedMat as any || null);
        if (fx) {
          (mat as any)._materialEffects = fx;
          if (Array.isArray(matAssumptions) && matAssumptions.length) {
            (mat as any)._materialEffects.assumptions = Array.from(new Set([...( (mat as any)._materialEffects.assumptions ?? [] ), ...matAssumptions]));
          }
        }
      } catch (_) {
        // ignore
      }
    }
  } catch (_) {
    // best-effort: fall back to existing behavior
  }

  // If machine id matches known Arburg catalog, populate machine defaults conservatively
  const machineId = String(machine.id || '').toLowerCase();
  if (machineId) {
    const pm = (ARBURG_PRESS_CATALOG || []).find((p: any) => String(p.id || '').toLowerCase() === machineId);
    if (pm) {
        machine.tonnellaggio_kN = machine.tonnellaggio_kN ?? pm.clampForce_kN;
        // prefer explicit machine values, otherwise derive from catalog screw variant (closest match or first available)
        let chosenVariant: any = null;
        if (pm.injectionUnits && pm.injectionUnits.length > 0) {
          // if user provided a screwDiameter, try to find exact match across all units
          if (machine.screwDiameter_mm) {
            for (const iu of pm.injectionUnits) {
              const v = (iu.screwVariants || []).find((s: any) => s.screwDiameter_mm === machine.screwDiameter_mm);
              if (v) { chosenVariant = v; break; }
            }
          }
          // fallback to first available variant
          if (!chosenVariant) {
            const firstIU = pm.injectionUnits[0];
            chosenVariant = (firstIU.screwVariants && firstIU.screwVariants[0]) || null;
          }
        }

        if (chosenVariant) {
          if (!machine.maxInjectionPressure_bar) machine.maxInjectionPressure_bar = chosenVariant.maxInjectionPressure_bar;
          if (!machine.maxInjectionSpeed_cm3_s) machine.maxInjectionSpeed_cm3_s = chosenVariant.maxInjectionFlow_cm3_s;
          if (!machine.maxShotVolume_cm3) machine.maxShotVolume_cm3 = chosenVariant.maxShotVolume_cm3;
          if (!machine.screwDiameter_mm) machine.screwDiameter_mm = chosenVariant.screwDiameter_mm;
        }
    }
  }

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

  // attach materialEffects (computed from typed profile when available) so calculateParameters can apply multipliers/warnings
  try {
    const typed = getMaterialById(String(mat.id || '').toLowerCase());
    const fx = materialEffects(typed as any || null);
    if (fx) (materialInfo as any)._materialEffects = fx;
  } catch (_) {
    // ignore
  }

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

    // requiredTonnage_t represents the tonnage required by the part/mold.
    // clampForceTon is used only as a fallback when required tonnage is unavailable.
    tonnellaggio:
      internal.requiredTonnage_t ??
      internal.clampForceTon ??
      internal.tonnellaggio ??
      0,
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

