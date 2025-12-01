import materialsData from '../data/materials.json';

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
  const material = materialsData.find(m => m.code.toUpperCase() === code.toUpperCase());
  return material as MaterialData || null;
}

/**
 * Get all available material codes
 */
export function getMaterialCodes(): string[] {
  return materialsData.map(m => m.code);
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