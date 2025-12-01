import type { ICalculationResult } from '../store/appStore';
import { findMaterialById, type IMaterial, type Brand, findPressModel } from '../fm-core';
import { getPressSpecs } from '../lib/pressData';

export function calculateInjection(
  params: { spessore: number; volumeCavita: number; volumeMaterozza: number; cushion: number },
  marca: Brand | string, 
  modello: string, 
  material: IMaterial | null
): ICalculationResult {
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

  const result: ICalculationResult = {
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
  return result;
}
