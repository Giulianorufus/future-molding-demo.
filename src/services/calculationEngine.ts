// Legacy appStore types removed; keep this service self-contained
import { findMaterialById, type IMaterial, type Brand, findPressModel } from '../fm-core';
import { getPressSpecs } from '../lib/pressData';
import { computeClampForce, estimateProjectedAreaFromBbox_mm, estimateProjectedAreaFromBbox3_mm } from "../lib/clampForce";
import { tuneClampForDefect } from "../lib/defectClampTuning";
import { estimateCavityPressure } from "../lib/cavityPressureEstimate";
import type { CadAnalysisMeta } from "../types/cadAnalysisMeta";
import { applyPressLimits } from '../lib/pressLimits'
import { mitigateClampOverload } from '../lib/clampOverloadMitigation'
import { computeClampCapacity } from '../lib/clampCapacity'
import { normalizeCorrections, normalizeStringArray } from '../lib/normalizeOutput'

export type CalcContext = {
  defectId?: string | null;
  severity?: "low" | "medium" | "high" | string | null;
  cadAnalysisMeta?: CadAnalysisMeta | null;
  // optional structured corrections applied earlier in the pipeline
  appliedCorrections?: any[] | null;
};

export function calculateInjection(
  params: { spessore: number; volumeCavita: number; volumeMaterozza: number; cushion: number },
  marca: Brand | string,
  modello: string,
  material: IMaterial | null,
  context?: CalcContext
): any {
  const { spessore, volumeCavita, volumeMaterozza, cushion } = params;
  
  // Validazione base: in modalità di emergenza non blocchiamo il calcolo se mancano dati
  const warnings: string[] = [];
  if (!marca || !modello || !material) {
    warnings.push('Seleziona marca, modello e materiale — procedo comunque con valori di default.');
  }
  
  // Consenti 0 per materozza e cushion (possono essere assenti)
  if (spessore <= 0 || volumeCavita <= 0 || volumeMaterozza < 0 || cushion < 0) {
    return {
      success: false,
      weight: 0,
      cycleTime: 0,
      errors: ['Spessore e volume cavità > 0; materozza e cushion ≥ 0']
    };
  }
  
  // Calcoli semplificati
  const totalVolume = volumeCavita + volumeMaterozza;
  const density = material?.density_g_cm3 ?? 1.2; // Usa densità del materiale o fallback
  const weight = totalVolume * density; // in grammi

  if (material && !material.density_g_cm3) {
    warnings.push('Attenzione: densità materiale non fornita. Usato valore di fallback ' + density + ' g/cm³.');
  }

  // Cooling and times (reuse previous heuristics)
  const kCool = 0.055;
  const coolingTime = Math.max(3, kCool * spessore * spessore);
  const injectionFill = Math.min(2.5, Math.max(0.6, totalVolume / 120));
  const packHold = Math.max(1.5, Math.min(6, coolingTime * 0.5));
  const openClose = 3;
  const cycleTime = injectionFill + packHold + coolingTime + openClose;

  // Pressa/specs
  const pressSpecs = getPressSpecs(String(marca), String(modello));
  const screw_diam = pressSpecs?.screwDiameter_mm ?? findPressModel(marca as any, modello)?.screw_diam_mm ?? undefined;
  const pressShot = pressSpecs?.maxShot_cm3 ?? undefined;
  const pressMaxSpeed = pressSpecs?.maxInjectionSpeed_cm3s ?? 120;
  const pressMaxPressure = pressSpecs?.maxInjectionPressure_bar ?? 2000;
  const clamp_t = pressSpecs?.clampForce_kN ? Math.round((pressSpecs!.clampForce_kN ?? 0) / 1000) : findPressModel(marca as any, modello)?.clampForce_t ?? undefined;

  // Derived parameters
  const injectionSpeed = totalVolume / injectionFill; // cm3/s
  // Pressure heuristic: scale with speed ratio to max, cap at press limit
  let injectionPressure = Math.round((injectionSpeed / (pressMaxSpeed || 1)) * (pressMaxPressure || 1000));
  if (injectionPressure < 5) injectionPressure = 5;
  injectionPressure = Math.min(injectionPressure, pressMaxPressure || injectionPressure);

  const pack_bar = Math.round(injectionPressure * 0.6);
  const pack_s = Math.min(6, Math.max(0.5, packHold));

  const vp_cm3 = volumeCavita; // report cavity volume as 'vp'

  // Simple rpm estimate (very approximate)
  let rpm = undefined as number | undefined;
  if (screw_diam && screw_diam > 0) {
    const area_cm2 = (Math.PI * (screw_diam * screw_diam) / 4) / 100; // mm^2 -> cm^2
    const linear_mm_per_s = (injectionSpeed / area_cm2) * 10; // rough
    rpm = Math.round(Math.min(3000, Math.max(10, linear_mm_per_s / 10)));
  }

  const backpressure = 10; // default fallback

  // Safety / material checks
  let shrinkage = 1.0;
  if (material) {
    const recSpeed = (material as any).recommendedInjectionSpeed_cm3s;
    if (Array.isArray(recSpeed) && recSpeed.length === 2) {
      const [minS, maxS] = recSpeed;
      if (injectionSpeed < minS || injectionSpeed > maxS) {
        warnings.push(`Velocità di iniezione (${Math.round(injectionSpeed)} cm³/s) fuori range raccomandato (${minS}-${maxS} cm³/s) per ${material.name}.`);
      }
    }
    const recPack = (material as any).recommendedPackPressure_bar;
    if (typeof recPack === 'number') {
      if (pack_bar > Math.round(recPack * 1.3)) {
        warnings.push(`Pressione di pack calcolata (${pack_bar} bar) significativamente superiore al valore raccomandato (${recPack} bar) per ${material.name}.`);
      }
    }
    shrinkage = (material as any).shrinkage_percent ?? 1.0;
  }

  // Check press limits
  if (injectionPressure > (pressMaxPressure || 0)) {
    warnings.push(`Pressione di iniezione calcolata (${injectionPressure} bar) oltre il limite macchina (${pressMaxPressure} bar).`);
  }

  // required tonnage heuristic: use projected area estimate from cavity volume
  const estimatedProjectedArea_cm2 = Math.max(10, Math.sqrt(volumeCavita) * 5);
  const requiredTonnage = Math.ceil((estimatedProjectedArea_cm2 * 0.1) / 1); // crude map cm2 -> kN -> ton
  const pressAdequate = clamp_t ? (clamp_t >= requiredTonnage) : true;

  const result: any = {
    success: true,
    weight: Math.round(weight * 100) / 100,
    cycleTime: Math.round(cycleTime * 100) / 100,
    injectionSpeed_cm3s: Math.round(injectionSpeed * 100) / 100,
    injectionPressure_bar: injectionPressure,
    vp_cm3: Math.round(vp_cm3 * 100) / 100,
    pack_bar,
    pack_s: Math.round(pack_s * 100) / 100,
    cooling_s: Math.round(coolingTime * 100) / 100,
    rpm: rpm ?? undefined,
    backpressure_bar: backpressure,
    requiredTonnage_t: requiredTonnage,
    pressAdequate,
  };
  // add shrinkage as non-typed field to avoid modifying shared interfaces
  (result as any).shrinkage_percent = Math.round(shrinkage * 100) / 100;
  if (warnings.length) (result as any).errors = warnings;

  // --- Clamp force estimate (added) ---
  // try read projected area from CAD analysis meta if available (non-blocking)
  const bboxRaw = context?.cadAnalysisMeta?.bbox_mm
  const bbox_mm = bboxRaw ? { x: Number(bboxRaw.x ?? 0), y: Number(bboxRaw.y ?? 0), z: Number(bboxRaw.z ?? 0) } : undefined
  const projectedFromCad = context?.cadAnalysisMeta?.projectedArea_cm2 ?? estimateProjectedAreaFromBbox3_mm(bbox_mm)

  const projectedArea_cm2 = projectedFromCad && projectedFromCad > 0 ? projectedFromCad : estimatedProjectedArea_cm2;

  const cavityPressure_bar_raw = (result as any)?.pack_bar ?? (result as any)?.injectionPressure_bar ?? null;
  let cavityPressure_bar = cavityPressure_bar_raw
  let cavityPressureReason = cavityPressure_bar_raw ? 'from_result' : 'default_450'

  if (!cavityPressure_bar_raw) {
    const matId = (material as any)?.id ?? null
    const cadMeta = context?.cadAnalysisMeta
    const est = estimateCavityPressure({ materialId: matId, thickness_mm: cadMeta?.thickness_mm ?? null, flowLength_mm: cadMeta?.flowLength_mm ?? null, volume_cm3: cadMeta?.volume_cm3 ?? null })
    cavityPressure_bar = est.estimatedCavityPressure_bar
    cavityPressureReason = est.reason
  }

  // --- defect-based tuning (non-invasive, best-effort) ---
  const baseCavityPressure_bar = cavityPressure_bar;
  const baseSafetyFactor = 1.15;

  const defectId = context?.defectId ?? null;
  const severity = context?.severity ?? null;

  const tuned = tuneClampForDefect({ defectId, severity, baseCavityPressure_bar, baseSafetyFactor });

  const clamp = computeClampForce({ projectedArea_cm2, cavityPressure_bar: tuned.tunedCavityPressure_bar, safetyFactor: tuned.tunedSafetyFactor });


  const pressClamp_t = clamp_t ?? 0;
  // preferire valore diretto in kN se presente in press specs, altrimenti usare la tonnellata->kN
  const pressClamp_kN = pressSpecs?.clampForce_kN ?? (pressClamp_t * 9.80665); // kN

  // compute clamp capacity (available + usable margin)
  const capacity = computeClampCapacity(pressSpecs as any, { tonnellaggio: pressClamp_kN })
  const clampForceAvailable_kN = capacity.clampForceAvailable_kN || 0
  const usableClampForce_kN = capacity.usableClampForce_kN || 0

  // Utilization should be computed against usable clamp force (operational margin)
  const clampUtilization_pct = usableClampForce_kN > 0 ? (clamp.clampForceRequired_kN / usableClampForce_kN) * 100 : 0;

  // build sources / assumptions / clamp warnings
  const warningsClamp: string[] = [];
  const assumptions: string[] = [];
  const sources: any = { projectedArea: 'unknown', thickness: 'unknown', flowLength: 'unknown' };

  const cadMeta = context?.cadAnalysisMeta as any | undefined;
  const projReason: string | undefined = cadMeta?._projectedAreaReason
  if (projReason && String(projReason).startsWith('mesh')) {
    sources.projectedArea = 'mesh'
  } else if (projReason === 'bbox-fallback') {
    sources.projectedArea = 'bbox'
    assumptions.push('Projected area from bbox fallback')
    // when projected area is from bbox fallback it's likely thickness/flowLength are also estimated
    assumptions.push('Thickness from bbox fallback')
    assumptions.push('Flow length from bbox fallback')
    sources.thickness = 'bbox'
    sources.flowLength = 'bbox'
  } else {
    // best-effort: if cadMeta exists and has values mark as mesh-derived
    if (cadMeta && (cadMeta.projectedArea_cm2 || cadMeta.thickness_mm || cadMeta.flowLength_mm)) {
      sources.projectedArea = cadMeta.projectedArea_cm2 ? 'mesh' : 'bbox'
      sources.thickness = cadMeta.thickness_mm ? 'mesh' : 'bbox'
      sources.flowLength = cadMeta.flowLength_mm ? 'mesh' : 'bbox'
    }
  }

  // build warnings comparing required clamp to usable and available
  if (clamp.clampForceRequired_kN > clampForceAvailable_kN && clampForceAvailable_kN > 0) {
    warningsClamp.push('Clamp utilization >100% of available clamp force: impossibile fisicamente')
  } else if (clamp.clampForceRequired_kN > usableClampForce_kN && usableClampForce_kN > 0) {
    warningsClamp.push('Clamp utilization >100% of usable clamp force: fuori finestra operativa')
  } else {
    const util = clampUtilization_pct;
    if (util > 95) warningsClamp.push('Clamp utilization >95%: pressa sottodimensionata')
    if (util > 85) warningsClamp.push('Clamp utilization >85%: rischio bava/instabilità')
  }

  // attach clamp fields to result
  (result as any).projectedArea_cm2 = clamp.projectedArea_cm2;
  (result as any).clampForceRequired_kN = clamp.clampForceRequired_kN;
  (result as any).clampPressureRequired_g_cm2 = clamp.clampPressureRequired_g_cm2;
  (result as any).clampUtilization_pct = Math.round(clampUtilization_pct * 100) / 100;
  (result as any).clampForceAvailable_kN = clampForceAvailable_kN;
  (result as any).usableClampForce_kN = usableClampForce_kN;
  if (capacity.assumption) {
    try { assumptions.push(String(capacity.assumption)) } catch (_) { /* ignore */ }
  }
  (result as any).warnings = Array.from(new Set([...(result as any).errors ?? [], ...warningsClamp]));
  (result as any).assumptions = assumptions;
  (result as any).sources = sources;

  // --- Apply press limits (clamp calculated params to press capabilities) ---
  try {
    const pressLimitsRes = applyPressLimits(result, pressSpecs as any)
    const added = pressLimitsRes.warningsAdded || []
    const clampedFields = pressLimitsRes.clampedFields || []
    if (added.length) {
      (result as any).warnings = Array.from(new Set([...(result as any).warnings ?? [], ...added]));
    }
    if (clampedFields.length) {
      (result as any).assumptions = Array.from(new Set([...(result as any).assumptions ?? [], 'Applied press limits clamp']));
      ;(result as any).sources = { ...(result as any).sources ?? {}, clampApplied: true };
    }
  } catch (e) {
    // best-effort: do not break calculation flow
  }

  // --- Mitigate clamp overload by reducing pack/injection pressure when utilization is critical ---
  try {
    const mitigation = mitigateClampOverload(result, { defectId, severity }, pressSpecs)
    if (mitigation.warningsAdded && mitigation.warningsAdded.length) {
      (result as any).warnings = Array.from(new Set([...(result as any).warnings ?? [], ...mitigation.warningsAdded]));
    }
    if (mitigation.appliedCorrections && mitigation.appliedCorrections.length) {
      (result as any).assumptions = Array.from(new Set([...(result as any).assumptions ?? [], 'Applied clamp overload mitigation']));
      ;(result as any).appliedCorrections = (result as any).appliedCorrections ?? [];
      ;(result as any).appliedCorrections.push(...mitigation.appliedCorrections);
    }
  } catch (e) {
    // swallow
  }
  // include any defect-applied corrections passed in the context
  if (context?.appliedCorrections && Array.isArray(context.appliedCorrections) && context.appliedCorrections.length) {
    ;(result as any).appliedCorrections = (result as any).appliedCorrections ?? []
    ;(result as any).appliedCorrections.push(...context.appliedCorrections)
  }

  // Normalize outputs (dedupe + stable ordering)
  const warningsNorm = normalizeStringArray((result as any).warnings ?? [])
  const assumptionsNorm = normalizeStringArray((result as any).assumptions ?? [])
  const appliedCorrectionsNorm = normalizeCorrections((result as any).appliedCorrections ?? [])

  // leave `sources` untouched (object)
  return {
    ...result,
    warnings: warningsNorm,
    assumptions: assumptionsNorm,
    appliedCorrections: appliedCorrectionsNorm,
  }
}
