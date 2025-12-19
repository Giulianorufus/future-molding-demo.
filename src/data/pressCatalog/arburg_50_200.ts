// src/data/pressCatalog/arburg_50_200.ts
import type { PressMachine } from "../pressData";

/**
 * Catalogo iniziale Arburg 50–200t (≈ 500–2000 kN).
 * NOTE: valori limiti "conservativi" come baseline; verranno raffinati con dati reali.
 */
export const arburgPressCatalog_50_200: PressMachine[] = [
  {
    id: "arburg-50t",
    nome: "Arburg 50t",
    clampForce_kN: 500,
    version: "0.1",
    source: "baseline",
    units: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 40,  maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 70,  maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 160, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 330 },
    ],
  },
  {
    id: "arburg-80t",
    nome: "Arburg 80t",
    clampForce_kN: 800,
    version: "0.1",
    source: "baseline",
    units: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 40,  maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 70,  maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 160, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 330 },
    ],
  },
  {
    id: "arburg-100t",
    nome: "Arburg 100t",
    clampForce_kN: 1000,
    version: "0.1",
    source: "baseline",
    units: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 40,  maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 70,  maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 160, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 330 },
    ],
  },
  {
    id: "arburg-150t",
    nome: "Arburg 150t",
    clampForce_kN: 1500,
    version: "0.1",
    source: "baseline",
    units: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 40,  maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 70,  maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 160, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 330 },
    ],
  },
  {
    id: "arburg-200t",
    nome: "Arburg 200t",
    clampForce_kN: 2000,
    version: "0.1",
    source: "baseline",
    units: [
      { screwDiameter_mm: 20, maxShotVolume_cm3: 40,  maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 80  },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 70,  maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 160, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 330 },
    ],
  },
];

export default arburgPressCatalog_50_200;
