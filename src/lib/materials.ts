import { materialCatalog, getMaterialInput } from '../data/materialCatalog';

export interface MaterialData {
  code: string;
  name: string;
  meltRange: number[];
  moldRange: number[];
  MVR: {
    value: number;
    tempC: number;
    loadKg: number;
    unit: string;
  };
  tipo: 'amorf' | 'semicristallino' | 'elastomero';
  viscosity: 'bassa' | 'media' | 'alta';
  notes: string;
}

/**
 * Get material technical data by code
 */
export function getMaterialByCode(code: string): MaterialData | null {
  if (!code) return null;
  const m: any = getMaterialInput(code);
  if (!m) return null;
  // Adapt materialCatalog entry to the legacy MaterialData shape as best-effort
  return ({
    code: m.id,
    name: (m.nome as any) || '',
    meltRange: [(m.tempCylStart_C ?? 0), (m.tempCylEnd_C ?? 0)],
    moldRange: [(m.tempMold_C ?? 0)],
    MVR: { value: 0, tempC: 0, loadKg: 0, unit: 'cm3/10min' },
    tipo: 'amorf',
    density_g_cm3: m.density_g_cm3 ?? 1,
    viscosity: (m.viscosityFactor && Number(m.viscosityFactor) >= 1.2) ? 'alta' : 'media',
    notes: (m as any).notes || '',
  } as MaterialData);
}

/**
 * Get all available material codes
 */
export function getMaterialCodes(): string[] {
  return materialCatalog.map((m) => m.id);
}

/**
 * Calculate viscosity factor based on MVR value
 * Lower MVR = higher viscosity = need lower speeds and higher pressures
 */
export function getViscosityFactor(mvr: number): { speedFactor: number; pressureFactor: number } {
  // MVR ranges: low (5-15), medium (15-25), high (25+)
  if (mvr <= 15) {
    return { speedFactor: 0.8, pressureFactor: 1.2 }; // High viscosity
  } else if (mvr <= 25) {
    return { speedFactor: 1.0, pressureFactor: 1.0 }; // Medium viscosity
  } else {
    return { speedFactor: 1.2, pressureFactor: 0.9 }; // Low viscosity
  }
}