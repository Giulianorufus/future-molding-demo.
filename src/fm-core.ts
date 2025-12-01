// src/fm-core.ts
// --- Tipi minimi riutilizzabili (no impatto UI) ---
export type Brand = string; // allow any brand defined in `src/lib/pressData.ts`

export interface IMaterial {
  id: string;
  name: string;
  density_g_cm3: number;
  meltTempMin_C: number;
  meltTempMax_C: number;
  moldTempMin_C: number;
  moldTempMax_C: number;
  notes?: string;
}

export interface IPressModel {
  id: string;
  screw_diam_mm: number;
  shotSize_cm3: number;
  clampForce_t: number;
}

export interface IPress {
  brand: Brand;
  models: IPressModel[];
}

export interface CalcInputs {
  thickness_mm: number;
  cavityVolume_cm3: number;
  runnerVolume_cm3: number;
  cushionTarget_cm3: number;
  materialId: string;
  brand: Brand;
  modelId: string;
}

export interface CalcResults {
  partWeight_g: number;
  cycleTime_s: number;
  validations: string[];
}

export type ValidationIssue = { field: keyof CalcInputs; message: string };
export type ValidationResult = { ok: boolean; issues: ValidationIssue[] };

// --- Dati centralizzati (elimina hardcoded sparsi) ---
export const MATERIALS: IMaterial[] = [
  { id: 'PP', name: 'PP', density_g_cm3: 0.90, meltTempMin_C: 190, meltTempMax_C: 230, moldTempMin_C: 20, moldTempMax_C: 50 },
  { id: 'ABS', name: 'ABS', density_g_cm3: 1.04, meltTempMin_C: 220, meltTempMax_C: 260, moldTempMin_C: 40, moldTempMax_C: 80 },
  { id: 'PC', name: 'PC', density_g_cm3: 1.20, meltTempMin_C: 260, meltTempMax_C: 315, moldTempMin_C: 80, moldTempMax_C: 120 },
  { id: 'PA-GF40', name: 'PA-GF40', density_g_cm3: 1.35, meltTempMin_C: 260, meltTempMax_C: 290, moldTempMin_C: 80, moldTempMax_C: 120 },
];

// Build PRESSES dynamically from the canonical press data in src/lib/pressData.ts
import { PRESSES as PRESS_DB } from './lib/pressData';

export const PRESSES: IPress[] = Object.keys(PRESS_DB).map((b) => ({
  brand: b,
  models: (PRESS_DB[b] ?? []).map((p) => ({
    id: p.model,
    screw_diam_mm: p.screwDiameter_mm,
    shotSize_cm3: p.maxShot_cm3,
    clampForce_t: Math.round((p.clampForce_kN ?? 0) / 1000),
  })),
}));

// --- Servizi leggeri (lettura dati) ---
export const getMaterials = () => MATERIALS;
export const findMaterialById = (id: string) => MATERIALS.find(m => m.id === id);
export const getBrands = (): Brand[] => PRESSES.map(p => p.brand);
export const getModelsByBrand = (brand?: Brand) => brand ? (PRESSES.find(p => p.brand === brand)?.models ?? []) : [];

// --- Validazione centralizzata (uguali messaggi ovunque) ---
const gt = (v: unknown, min = 0) => Number.isFinite(Number(v)) && Number(v) > min;
export function validateCalcInputs(i: Partial<CalcInputs>): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!i.materialId) issues.push({ field: 'materialId', message: 'Seleziona un materiale.' });
  if (!i.brand)     issues.push({ field: 'brand', message: 'Seleziona una marca pressa.' });
  if (!i.modelId)   issues.push({ field: 'modelId', message: 'Seleziona un modello pressa.' });

  if (!gt(i.thickness_mm))     issues.push({ field: 'thickness_mm', message: 'Spessore > 0.' });
  if (!gt(i.cavityVolume_cm3)) issues.push({ field: 'cavityVolume_cm3', message: 'Volume cavità > 0.' });
  if (Number(i.runnerVolume_cm3) < 0)   issues.push({ field: 'runnerVolume_cm3', message: 'Materozza ≥ 0.' });
  if (Number(i.cushionTarget_cm3) < 0)  issues.push({ field: 'cushionTarget_cm3', message: 'Cushion ≥ 0.' });

  return { ok: issues.length === 0, issues };
}

/** Trova un modello di pressa specifico */
export function findPressModel(brand: Brand | undefined, modelId: string | undefined) {
  if (!brand || !modelId) return undefined;
  const press = PRESSES.find(p => p.brand === brand);
  return press?.models.find(m => m.id === modelId);
}

// --- Sanitizzazione input (evita NaN in engine) ---
export function buildCalcInputs(partial: Partial<CalcInputs>): CalcInputs {
  return {
    thickness_mm: Number(partial.thickness_mm ?? 2),
    cavityVolume_cm3: Number(partial.cavityVolume_cm3 ?? 10),
    runnerVolume_cm3: Number(partial.runnerVolume_cm3 ?? 0),
    cushionTarget_cm3: Number(partial.cushionTarget_cm3 ?? 1),
    materialId: String(partial.materialId ?? ''),
    brand: partial.brand as Brand,
    modelId: String(partial.modelId ?? ''),
  };
}

// --- Wrapper calcolo (usa il tuo engine se esiste) ---
export function safeCalculate(calculateAll: (i: CalcInputs) => CalcResults, i: CalcInputs): CalcResults {
  try {
    return calculateAll(i);
  } catch {
    // fallback ultra-semplice (non usato se il tuo engine funziona)
    const m = findMaterialById(i.materialId);
    const density = m?.density_g_cm3 ?? 1.0;
    const totalVol = i.cavityVolume_cm3 + i.runnerVolume_cm3 - i.cushionTarget_cm3;
    const partWeight_g = Math.max(0, totalVol) * density;
    const cycleTime_s = Math.max(8, i.thickness_mm * 3 + totalVol * 0.3);
    return { partWeight_g, cycleTime_s, validations: ['Fallback calcolo attivato'] };
  }
}

