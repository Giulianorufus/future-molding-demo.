export type Polymer = "PP" | "ABS" | "PC" | "PA6" | "PA66";
export type Reinforcement = "NONE" | "GF";
export type ViscosityClass = "LOW" | "MED" | "HIGH"; // LOW = più fluido

export interface TempRangeC {
  meltMinC: number;
  meltMaxC: number;
  moldMinC: number;
  moldMaxC: number;
}

export interface MaterialEffectsMultipliers {
  flow: number; // su velocità target o fill aggressiveness
  pressure: number; // su injection/holding pressure target
  cooling: number; // su cooling time target
  shrink: number; // fattore su shrink nominale
}

export interface MaterialProfile {
  id: string; // es: "PP-GEN", "PA66-GF30"
  name: string;
  polymer: Polymer;
  reinforcement: Reinforcement;
  gfPercent?: 30 | 60;

  density_g_cm3: number;
  shrinkMin_pct: number;
  shrinkMax_pct: number;

  temps: TempRangeC;

  // MVR/MFI (indicativo) o classe viscosità se non disponibile
  mvr_cm3_10min?: number;
  viscosityClass: ViscosityClass;

  effects: MaterialEffectsMultipliers;

  notes?: string[];
  source?: string;
  version?: string;
}


