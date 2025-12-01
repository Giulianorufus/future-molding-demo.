import { PRESSES, getBrands, getModels, getPressSpecs } from './pressData';

export type MachineProfile = {
  name: string;
  maxShot_cc: number;
  maxInj_cc_s: number;
  clamp_kN: number;
};

// Convert PressSpecs to MachineProfile format used by calcEngine
export function getMachineProfile(brand: string | null, model: string | null): MachineProfile {
  if (!brand || !model) {
    // Return a generic fallback
    return {
      name: "Generic 200t",
      maxShot_cc: 200,
      maxInj_cc_s: 120,
      clamp_kN: 2000,
    };
  }

  const specs = getPressSpecs(brand, model);
  if (!specs) {
    // Return a generic fallback
    return {
      name: "Generic 200t", 
      maxShot_cc: 200,
      maxInj_cc_s: 120,
      clamp_kN: 2000,
    };
  }

  return {
    name: `${specs.brand} ${specs.model}`,
    maxShot_cc: specs.maxShot_cm3,
    maxInj_cc_s: specs.maxInjectionSpeed_cm3s,
    clamp_kN: specs.clampForce_kN,
  };
}

// List all available brands
export function listBrands(): string[] {
  return getBrands();
}

// List models for a given brand
export function listModels(brand: string): string[] {
  return getModels(brand);
}