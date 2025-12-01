// Tipi ausiliari per calcoli estesi del motore di calcolo
export interface GeometrySummary {
  volumePezzo_cm3?: number | null;
  volumeMaterozza_cm3?: number | null;
  areaProiettata_cm2?: number | null;
  spessoreMedio_mm?: number | null;
}

export interface PackResult {
  packPressureBar: number;
  packTimeSec: number;
}

export interface VPResult {
  vpVolumeCm3: number;
  switchVolumeCm3: number;
}

export interface TonnageResult {
  requiredTonnage_t: number;
  pressAdequate: boolean;
}

export interface TemperatureSuggestion {
  suggestedMeltTempC?: number;
  suggestedMoldTempC?: number;
}

export interface CalcSuggestions {
  notes?: string[];
}

/**
 * Nuovi tipi di ingresso/uscita (compatibili con la struttura richiesta dall'utente)
 */
export interface GeometryInput {
  volumePezzo_cm3: number;
  volumeMaterozza_cm3: number;
  volumeTotale_cm3: number;
  areaProiettata_cm2: number;
  spessoreMedio_mm: number;
}

export interface MachineInput {
  id: string;
  nome: string;
  tonnellaggio_kN: number;
  maxShotVolume_cm3: number;
  screwDiameter_mm: number;
  maxInjectionSpeed_cm3_s: number;
  maxInjectionPressure_bar: number;
}

export interface MaterialInput {
  id: string;
  nome: string;
  density_g_cm3: number;
  shrinkage_percent: number;
  vpFactor: number;
  packPressure_bar: number;
  packTime_s: number;
  tempCylStart_C: number;
  tempCylMid_C: number;
  tempCylEnd_C: number;
  tempMold_C: number;
  tempNozzle_C: number;
  speedBase_cm3_s: number;
  viscosityFactor: number;
}

export interface CalcInput {
  geometry: GeometryInput;
  machine: MachineInput;
  material: MaterialInput;
}

export interface TemperatureOutput {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  stampo: number;
  ugello: number;
}

export interface CalcOutput {
  // Geometria
  volumePezzo: number;
  volumeMaterozza: number;
  volumeTotale: number;
  areaProiettata: number;
  spessoreMedio: number;

  // Iniezione
  velIniezione: number;
  pressioneIniezione: number;
  fillTime: number;

  // VP
  vp: number;

  // Pack
  packPressione: number;
  packTempo: number;

  // Raffreddamento
  coolingTime: number;

  // Plastificazione (per ora placeholder, da affinare con dati macchina)
  velocitaVite?: number;
  contropressione?: number;
  tempoDosatura?: number;

  // Tonnellaggio
  tonnellaggio: number;
  tonnellaggioPressa?: number;

  // Temperature
  temperature: TemperatureOutput;

  // Suggerimenti intelligenti
  suggerimenti: string[];
  // Profili opzionali da motore avanzato
  profiloIniezione?: { step1: number; step2: number; step3: number };
  profiloPressione?: { step1: number; step2: number; step3: number };
  profiloPack?: { step1: number; step2: number; step3: number };
}
