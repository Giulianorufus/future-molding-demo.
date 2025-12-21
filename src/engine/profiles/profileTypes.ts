export type EndBy =
  | { kind: "volumePercent"; value: number }   // 0..100
  | { kind: "time_s"; value: number };         // >0

export type InjectionStep = {
  step: number;                 // 1..N
  speed_cm3_s: number;          // cm^3/s
  endBy: EndBy;                 // tipicamente volumePercent
};

export type PackingStep = {
  step: number;                 // 1..N
  pressure_bar: number;         // bar
  time_s: number;               // secondi
};

export type ProfileBuildInput = {
  // pezzo
  thicknessAvg_mm?: number;
  thicknessMin_mm?: number;
  thicknessMax_mm?: number;

  // materiale
  materialId?: string;          // es: "PP", "ABS", "PC", "PA6", "PA66-GF60"

  // utilizzi (0..1)
  shotUtilization?: number;     // shot / maxShot
  speedUtilization?: number;    // targetSpeed / maxSpeed
  pressureUtilization?: number; // peakPress / maxPress

  // target/limiti macchina
  targetInjectionSpeed_cm3_s: number;
  maxInjectionSpeed_cm3_s: number;

  peakInjectionPressure_bar: number;
  maxInjectionPressure_bar: number;
};

export type BuiltProfiles = {
  complexityScore: number;        // 0..100
  injectionSteps: number;         // 2..5
  packingSteps: number;           // 1..4
  switchover_volumePercent: number;

  injectionProfile: InjectionStep[];
  packingProfile: PackingStep[];
};
