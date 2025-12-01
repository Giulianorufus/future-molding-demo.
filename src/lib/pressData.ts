/* FILE: src/lib/pressData.ts */
export type PressSpecs = {
  brand: string;
  model: string;
  clampForce_kN: number;            // forza di chiusura nominale
  screwDiameter_mm: number;         // Ø vite
  maxShot_cm3: number;              // volume max iniezione
  maxInjectionSpeed_cm3s: number;   // velocità max iniezione
  maxInjectionPressure_bar: number; // pressione max iniezione
  minCushion_cm3: number;           // volume minimo cuscino
};

// --- Dati minimi per far funzionare Subito la pagina ---
const DB: Record<string, PressSpecs[]> = {
  Arburg: [
    { brand: "Arburg", model: "320C", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2000, minCushion_cm3: 5 },
    { brand: "Arburg", model: "420C", clampForce_kN: 1000, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 120, maxInjectionPressure_bar: 2000, minCushion_cm3: 10 },
    { brand: "Arburg", model: "470C", clampForce_kN: 1500, screwDiameter_mm: 40, maxShot_cm3: 200, maxInjectionSpeed_cm3s: 140, maxInjectionPressure_bar: 2000, minCushion_cm3: 12 },
    { brand: "Arburg", model: "520A", clampForce_kN: 2000, screwDiameter_mm: 45, maxShot_cm3: 300, maxInjectionSpeed_cm3s: 160, maxInjectionPressure_bar: 2000, minCushion_cm3: 15 },
    { brand: "Arburg", model: "630H", clampForce_kN: 3200, screwDiameter_mm: 60, maxShot_cm3: 500, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2000, minCushion_cm3: 20 },
  ],
  Engel: [
    { brand: "Engel", model: "Victory 50", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2100, minCushion_cm3: 5 },
    { brand: "Engel", model: "Victory 120", clampForce_kN: 1200, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 130, maxInjectionPressure_bar: 2100, minCushion_cm3: 10 },
    { brand: "Engel", model: "Victory 200", clampForce_kN: 2000, screwDiameter_mm: 45, maxShot_cm3: 300, maxInjectionSpeed_cm3s: 160, maxInjectionPressure_bar: 2100, minCushion_cm3: 15 },
    { brand: "Engel", model: "Duo 350", clampForce_kN: 3500, screwDiameter_mm: 55, maxShot_cm3: 400, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2100, minCushion_cm3: 18 },
    { brand: "Engel", model: "Duo 500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2100, minCushion_cm3: 25 },
  ],
  NegriBossi: [
    { brand: "Negri Bossi", model: "V50", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2000, minCushion_cm3: 5 },
    { brand: "Negri Bossi", model: "V100", clampForce_kN: 1000, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 120, maxInjectionPressure_bar: 2000, minCushion_cm3: 10 },
    { brand: "Negri Bossi", model: "V180", clampForce_kN: 1800, screwDiameter_mm: 40, maxShot_cm3: 200, maxInjectionSpeed_cm3s: 140, maxInjectionPressure_bar: 2000, minCushion_cm3: 12 },
    { brand: "Negri Bossi", model: "V270", clampForce_kN: 2700, screwDiameter_mm: 50, maxShot_cm3: 350, maxInjectionSpeed_cm3s: 170, maxInjectionPressure_bar: 2000, minCushion_cm3: 18 },
    { brand: "Negri Bossi", model: "V500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2000, minCushion_cm3: 25 },
  ],
  KraussMaffei: [
    { brand: "KraussMaffei", model: "CX 50", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2100, minCushion_cm3: 5 },
    { brand: "KraussMaffei", model: "CX 80", clampForce_kN: 800, screwDiameter_mm: 32, maxShot_cm3: 100, maxInjectionSpeed_cm3s: 110, maxInjectionPressure_bar: 2100, minCushion_cm3: 7 },
    { brand: "KraussMaffei", model: "CX 160", clampForce_kN: 1600, screwDiameter_mm: 40, maxShot_cm3: 200, maxInjectionSpeed_cm3s: 140, maxInjectionPressure_bar: 2100, minCushion_cm3: 12 },
    { brand: "KraussMaffei", model: "GX 300", clampForce_kN: 3000, screwDiameter_mm: 55, maxShot_cm3: 400, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2100, minCushion_cm3: 18 },
    { brand: "KraussMaffei", model: "GX 500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2100, minCushion_cm3: 25 },
  ],
  Haitian: [
    { brand: "Haitian", model: "MA 60", clampForce_kN: 600, screwDiameter_mm: 28, maxShot_cm3: 70, maxInjectionSpeed_cm3s: 110, maxInjectionPressure_bar: 2000, minCushion_cm3: 6 },
    { brand: "Haitian", model: "MA 120", clampForce_kN: 1200, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 130, maxInjectionPressure_bar: 2000, minCushion_cm3: 10 },
    { brand: "Haitian", model: "MA 200", clampForce_kN: 2000, screwDiameter_mm: 45, maxShot_cm3: 300, maxInjectionSpeed_cm3s: 160, maxInjectionPressure_bar: 2000, minCushion_cm3: 15 },
    { brand: "Haitian", model: "MA 320", clampForce_kN: 3200, screwDiameter_mm: 55, maxShot_cm3: 400, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2000, minCushion_cm3: 18 },
    { brand: "Haitian", model: "MA 500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2000, minCushion_cm3: 25 },
  ],
  Sandretto: [
    { brand: "Sandretto", model: "Serie 50", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2000, minCushion_cm3: 5 },
    { brand: "Sandretto", model: "Serie 100", clampForce_kN: 1000, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 120, maxInjectionPressure_bar: 2000, minCushion_cm3: 10 },
    { brand: "Sandretto", model: "Serie 200", clampForce_kN: 2000, screwDiameter_mm: 45, maxShot_cm3: 300, maxInjectionSpeed_cm3s: 160, maxInjectionPressure_bar: 2000, minCushion_cm3: 15 },
    { brand: "Sandretto", model: "Serie 300", clampForce_kN: 3000, screwDiameter_mm: 55, maxShot_cm3: 400, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2000, minCushion_cm3: 18 },
    { brand: "Sandretto", model: "Serie 500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2000, minCushion_cm3: 25 },
  ],
  BMB: [
    { brand: "BMB", model: "eKW 50", clampForce_kN: 500, screwDiameter_mm: 25, maxShot_cm3: 60, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 2000, minCushion_cm3: 5 },
    { brand: "BMB", model: "eKW 100", clampForce_kN: 1000, screwDiameter_mm: 35, maxShot_cm3: 150, maxInjectionSpeed_cm3s: 120, maxInjectionPressure_bar: 2000, minCushion_cm3: 10 },
    { brand: "BMB", model: "eKW 200", clampForce_kN: 2000, screwDiameter_mm: 45, maxShot_cm3: 300, maxInjectionSpeed_cm3s: 160, maxInjectionPressure_bar: 2000, minCushion_cm3: 15 },
    { brand: "BMB", model: "eKW 300", clampForce_kN: 3000, screwDiameter_mm: 55, maxShot_cm3: 400, maxInjectionSpeed_cm3s: 180, maxInjectionPressure_bar: 2000, minCushion_cm3: 18 },
    { brand: "BMB", model: "eKW 500", clampForce_kN: 5000, screwDiameter_mm: 70, maxShot_cm3: 600, maxInjectionSpeed_cm3s: 200, maxInjectionPressure_bar: 2000, minCushion_cm3: 25 },
  ],
  "Generic": [
    { brand: "Generic", model: "250", clampForce_kN: 250, screwDiameter_mm: 30, maxShot_cm3: 80, maxInjectionSpeed_cm3s: 100, maxInjectionPressure_bar: 1800, minCushion_cm3: 8 },
  ],
};
// Export PRESSES per compatibilità
export const PRESSES = DB;

// --- API semplici usate da Parametri.tsx ---
export function getBrands(): string[] {
  return Object.keys(DB);
}

export function getModels(brand: string): string[] {
  const list = DB[brand] ?? [];
  return list.map((p) => p.model);
}

export function getPressSpecs(brand: string, model: string): PressSpecs | undefined {
  const list = DB[brand] ?? [];
  return list.find((p) => p.model === model);
}
