export interface ScrewVariant {
  screwDiameter_mm: number;
  maxShotVolume_cm3: number; // colpo utile
  maxInjectionPressure_bar: number;
  maxInjectionFlow_cm3_s: number; // portata massima
  L_over_D?: number;
  maxScrewTorque_Nm?: number;
}

export interface InjectionUnit {
  euromapCode?: number;
  id?: string;
  screwVariants: ScrewVariant[];
}

export interface PressMachine {
  id: string;
  nome: string;
  clampForce_kN: number;
  injectionUnits: InjectionUnit[];
  source?: string;
  notes?: string;
}

/**
 * Baseline “credibile” (conservativa) per Arburg 50–200 ton.
 * DA CALIBRARE con dati targa (per modello e unità iniezione reali).
 */
export const ARBURG_PRESS_CATALOG: PressMachine[] = [
  // 50t: EUROMAP 100 + 170 → diametri 20/25/30/35
  {
    id: "arburg-50t",
    nome: "Arburg ALLROUNDER 320 C (≈50t)",
    clampForce_kN: 500,
    injectionUnits: [
      {
        euromapCode: 100,
        id: "euromap-100",
        screwVariants: [
          { screwDiameter_mm: 20, maxShotVolume_cm3: 22, maxInjectionPressure_bar: 2600, maxInjectionFlow_cm3_s: 70, L_over_D: 20 },
          { screwDiameter_mm: 25, maxShotVolume_cm3: 55, maxInjectionPressure_bar: 2500, maxInjectionFlow_cm3_s: 110, L_over_D: 20 },
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 140, L_over_D: 20 },
        ],
      },
      {
        euromapCode: 170,
        id: "euromap-170",
        screwVariants: [
          { screwDiameter_mm: 25, maxShotVolume_cm3: 55, maxInjectionPressure_bar: 2500, maxInjectionFlow_cm3_s: 110, L_over_D: 18 },
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 140, L_over_D: 18 },
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 170, L_over_D: 18 },
        ],
      },
    ],
    notes: "EUROMAP 100/170 — dati esemplificativi da targa Arburg",
  },

  // 80t: mix 170/290/400 → diametri 25/30/35/40/45
  {
    id: "arburg-80t",
    nome: "Arburg ALLROUNDER 470 S (≈80t)",
    clampForce_kN: 800,
    injectionUnits: [
      {
        euromapCode: 170,
        id: "euromap-170",
        screwVariants: [
          { screwDiameter_mm: 25, maxShotVolume_cm3: 55, maxInjectionPressure_bar: 2500, maxInjectionFlow_cm3_s: 120 },
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 160 },
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 190 },
        ],
      },
      {
        euromapCode: 290,
        id: "euromap-290",
        screwVariants: [
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 170 },
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 200 },
          { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionFlow_cm3_s: 230 },
        ],
      },
      {
        euromapCode: 400,
        id: "euromap-400",
        screwVariants: [
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 210 },
          { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionFlow_cm3_s: 250 },
          { screwDiameter_mm: 45, maxShotVolume_cm3: 235, maxInjectionPressure_bar: 1900, maxInjectionFlow_cm3_s: 290 },
        ],
      },
    ],
  },

  // 100t: similar to 80t (470 S / 420 C variants) — diameters 25..45
  {
    id: "arburg-100t",
    nome: "Arburg ALLROUNDER 470 S / 420 C (≈100t)",
    clampForce_kN: 1000,
    injectionUnits: [
      {
        euromapCode: 290,
        id: "euromap-290",
        screwVariants: [
          { screwDiameter_mm: 25, maxShotVolume_cm3: 55, maxInjectionPressure_bar: 2500, maxInjectionFlow_cm3_s: 130 },
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 170 },
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 210 },
        ],
      },
      {
        euromapCode: 400,
        id: "euromap-400",
        screwVariants: [
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 210 },
          { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionFlow_cm3_s: 250 },
          { screwDiameter_mm: 45, maxShotVolume_cm3: 235, maxInjectionPressure_bar: 1900, maxInjectionFlow_cm3_s: 290 },
        ],
      },
    ],
  },

  // 150t: 290/400/800 → diameters 30/35/40/45/55
  {
    id: "arburg-150t",
    nome: "Arburg ALLROUNDER 520 A (≈150t)",
    clampForce_kN: 1500,
    injectionUnits: [
      {
        euromapCode: 290,
        id: "euromap-290",
        screwVariants: [
          { screwDiameter_mm: 30, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2300, maxInjectionFlow_cm3_s: 190 },
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 230 },
          { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionFlow_cm3_s: 280 },
        ],
      },
      {
        euromapCode: 400,
        id: "euromap-400",
        screwVariants: [
          { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionFlow_cm3_s: 230 },
          { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionFlow_cm3_s: 280 },
          { screwDiameter_mm: 45, maxShotVolume_cm3: 235, maxInjectionPressure_bar: 1900, maxInjectionFlow_cm3_s: 310 },
        ],
      },
      {
        euromapCode: 800,
        id: "euromap-800",
        screwVariants: [
          { screwDiameter_mm: 45, maxShotVolume_cm3: 235, maxInjectionPressure_bar: 1900, maxInjectionFlow_cm3_s: 320 },
          { screwDiameter_mm: 55, maxShotVolume_cm3: 395, maxInjectionPressure_bar: 1600, maxInjectionFlow_cm3_s: 420 },
        ],
      },
    ],
  },

  // 200t: euromap 800 → 45/50/55
  {
    id: "arburg-200t",
    nome: "Arburg ALLROUNDER 570 C (≈200t)",
    clampForce_kN: 2000,
    injectionUnits: [
      {
        euromapCode: 800,
        id: "euromap-800",
        screwVariants: [
          { screwDiameter_mm: 45, maxShotVolume_cm3: 235, maxInjectionPressure_bar: 1900, maxInjectionFlow_cm3_s: 320 },
          { screwDiameter_mm: 50, maxShotVolume_cm3: 310, maxInjectionPressure_bar: 1750, maxInjectionFlow_cm3_s: 380 },
          { screwDiameter_mm: 55, maxShotVolume_cm3: 395, maxInjectionPressure_bar: 1600, maxInjectionFlow_cm3_s: 450 },
        ],
      },
    ],
  },
];
// Catalogo ufficiale Future Molding — formato unificato reale Arburg

export interface ArburgInjectionUnit {
  screwDiameter_mm: number;
  maxShotVolume_cm3: number;
  maxInjectionPressure_bar: number;
  maxInjectionSpeed_cm3_s: number;
}

export interface ArburgMachine {
  id: string;
  nome: string;
  tonnellaggio_kN: number;
  injectionUnits: ArburgInjectionUnit[];
  source?: string;
  version?: string;
}

const arburgPressCatalog: ArburgMachine[] = [
  {
    id: "arburg-50t",
    nome: "Arburg ~50t class",
    tonnellaggio_kN: 500,
    injectionUnits: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 22,  maxInjectionPressure_bar: 2600, maxInjectionSpeed_cm3_s: 70  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 55,  maxInjectionPressure_bar: 2500, maxInjectionSpeed_cm3_s: 110 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 85,  maxInjectionPressure_bar: 2300, maxInjectionSpeed_cm3_s: 140 },
    ],
    source: "baseline",
    version: "v1",
  },
  {
    id: "arburg-80t",
    nome: "Arburg ~80t class",
    tonnellaggio_kN: 800,
    injectionUnits: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 22,  maxInjectionPressure_bar: 2600, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 55,  maxInjectionPressure_bar: 2500, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 85,  maxInjectionPressure_bar: 2300, maxInjectionSpeed_cm3_s: 160 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 190 },
    ],
    source: "baseline",
    version: "v1",
  },
  {
    id: "arburg-100t",
    nome: "Arburg ~100t class",
    tonnellaggio_kN: 1000,
    injectionUnits: [
      { screwDiameter_mm: 25, maxShotVolume_cm3: 55,  maxInjectionPressure_bar: 2500, maxInjectionSpeed_cm3_s: 130 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 85,  maxInjectionPressure_bar: 2300, maxInjectionSpeed_cm3_s: 170 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 210 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 250 },
    ],
    source: "baseline",
    version: "v1",
  },
  {
    id: "arburg-150t",
    nome: "Arburg ~150t class",
    tonnellaggio_kN: 1500,
    injectionUnits: [
      { screwDiameter_mm: 30, maxShotVolume_cm3: 85,  maxInjectionPressure_bar: 2300, maxInjectionSpeed_cm3_s: 190 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 230 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 280 },
    ],
    source: "baseline",
    version: "v1",
  },
  {
    id: "arburg-200t",
    nome: "Arburg ~200t class",
    tonnellaggio_kN: 2000,
    injectionUnits: [
      { screwDiameter_mm: 30, maxShotVolume_cm3: 85,  maxInjectionPressure_bar: 2300, maxInjectionSpeed_cm3_s: 200 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 310 },
    ],
    source: "baseline",
    version: "v1",
  },
];

// Helper per ottenere unità specifica (cerca tra tutte le injectionUnits e screwVariants)
export function getMachineInputFromArburg(id: string, screwDiameter_mm: number) {
  const m = ARBURG_PRESS_CATALOG.find((x) => x.id === id);
  if (!m) return null;
  for (const iu of m.injectionUnits || []) {
    const v = (iu.screwVariants || []).find((s) => s.screwDiameter_mm === screwDiameter_mm);
    if (v) {
      return {
        id: m.id,
        nome: m.nome,
        clampForce_kN: m.clampForce_kN,
        screwDiameter_mm: v.screwDiameter_mm,
        maxShotVolume_cm3: v.maxShotVolume_cm3,
        maxInjectionFlow_cm3_s: v.maxInjectionFlow_cm3_s,
        maxInjectionPressure_bar: v.maxInjectionPressure_bar,
        L_over_D: v.L_over_D,
        maxScrewTorque_Nm: v.maxScrewTorque_Nm,
      };
    }
  }
  return null;
}
