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

  // ---------------------------------------------------------
  // 170 — circa 150 kN
  // ---------------------------------------------------------
  {
    id: "arburg-170-s",
    nome: "Arburg 170 S",
    tonnellaggio_kN: 150,
    injectionUnits: [
      { screwDiameter_mm: 18, maxShotVolume_cm3: 28, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 140 },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 52, maxInjectionPressure_bar: 1950, maxInjectionSpeed_cm3_s: 160 },
    ],
  },

  // ---------------------------------------------------------
  // 220 — piccoli
  // ---------------------------------------------------------
  {
    id: "arburg-220-m",
    nome: "Arburg 220 M",
    tonnellaggio_kN: 25,
    injectionUnits: [
      { screwDiameter_mm: 18, maxShotVolume_cm3: 20, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 22, maxShotVolume_cm3: 35, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 50, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 170 },
    ],
  },

  // ---------------------------------------------------------
  // 270 — medie
  // ---------------------------------------------------------
  {
    id: "arburg-270-s",
    nome: "Arburg 270 S",
    tonnellaggio_kN: 35,
    injectionUnits: [
      { screwDiameter_mm: 18, maxShotVolume_cm3: 25, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 200 },
      { screwDiameter_mm: 22, maxShotVolume_cm3: 45, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 200 },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 65, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 190 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 90, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 180 },
    ],
  },

  {
    id: "arburg-270-c",
    nome: "Arburg 270 C",
    tonnellaggio_kN: 250,
    injectionUnits: [
      { screwDiameter_mm: 18, maxShotVolume_cm3: 40, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 160 },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 72, maxInjectionPressure_bar: 1950, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 1850, maxInjectionSpeed_cm3_s: 200 },
    ],
  },

  // ---------------------------------------------------------
  // 320 — fascia superiore
  // ---------------------------------------------------------
  {
    id: "arburg-320-c",
    nome: "Arburg 320 C",
    tonnellaggio_kN: 350,
    injectionUnits: [
      { screwDiameter_mm: 18, maxShotVolume_cm3: 52, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 160 },
      { screwDiameter_mm: 25, maxShotVolume_cm3: 92, maxInjectionPressure_bar: 2050, maxInjectionSpeed_cm3_s: 190 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 135, maxInjectionPressure_bar: 1950, maxInjectionSpeed_cm3_s: 210 },
    ],
  },

  // ---------------------------------------------------------
  // 370 — U e C
  // ---------------------------------------------------------
  {
    id: "arburg-370-u",
    nome: "Arburg 370 U",
    tonnellaggio_kN: 400,
    injectionUnits: [
      { screwDiameter_mm: 25, maxShotVolume_cm3: 92, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 200 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 135, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 220 },
    ],
  },

  {
    id: "arburg-370-c",
    nome: "Arburg 370 C",
    tonnellaggio_kN: 500,
    injectionUnits: [
      { screwDiameter_mm: 25, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 210 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 150, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 230 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1900, maxInjectionSpeed_cm3_s: 250 },
    ],
  },

  {
    id: "arburg-370-s",
    nome: "Arburg 370 S",
    tonnellaggio_kN: 100,
    injectionUnits: [
      { screwDiameter_mm: 25, maxShotVolume_cm3: 85, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 200 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 125, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 190 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 175, maxInjectionPressure_bar: 1900, maxInjectionSpeed_cm3_s: 180 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 240, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 170 },
    ],
  },

  // ---------------------------------------------------------
  // 420 — varie configurazioni
  // ---------------------------------------------------------
  {
    id: "arburg-420-c",
    nome: "Arburg 420 C",
    tonnellaggio_kN: 700,
    injectionUnits: [
      { screwDiameter_mm: 25, maxShotVolume_cm3: 110, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 210 },
      { screwDiameter_mm: 30, maxShotVolume_cm3: 150, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 230 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 1900, maxInjectionSpeed_cm3_s: 250 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 320, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 260 },
    ],
  },

  {
    id: "arburg-420-h",
    nome: "Arburg 420 H (Ibrida)",
    tonnellaggio_kN: 1000,
    injectionUnits: [
      { screwDiameter_mm: 30, maxShotVolume_cm3: 150, maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 260 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 280 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 320, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 300 },
    ],
  },

  // ---------------------------------------------------------
  // 470 — fascia alta
  // ---------------------------------------------------------
  {
    id: "arburg-470-c",
    nome: "Arburg 470 C",
    tonnellaggio_kN: 1000,
    injectionUnits: [
      { screwDiameter_mm: 30, maxShotVolume_cm3: 150, maxInjectionPressure_bar: 2200, maxInjectionSpeed_cm3_s: 260 },
      { screwDiameter_mm: 35, maxShotVolume_cm3: 220, maxInjectionPressure_bar: 2100, maxInjectionSpeed_cm3_s: 280 },
      { screwDiameter_mm: 40, maxShotVolume_cm3: 320, maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3_s: 300 },
    ],
  },

  // ---------------------------------------------------------
  // 520, 570, 630, 720 — range molto grandi
  // ---------------------------------------------------------
  {
    id: "arburg-520-c-2500",
    nome: "Arburg 520 C 2500",
    tonnellaggio_kN: 250,
    injectionUnits: [
      { screwDiameter_mm: 40, maxShotVolume_cm3: 330, maxInjectionPressure_bar: 1800, maxInjectionSpeed_cm3_s: 150 },
      { screwDiameter_mm: 45, maxShotVolume_cm3: 420, maxInjectionPressure_bar: 1700, maxInjectionSpeed_cm3_s: 140 },
      { screwDiameter_mm: 50, maxShotVolume_cm3: 520, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 130 },
    ],
  },

  {
    id: "arburg-570-c-3200",
    nome: "Arburg 570 C 3200",
    tonnellaggio_kN: 320,
    injectionUnits: [
      { screwDiameter_mm: 45, maxShotVolume_cm3: 450, maxInjectionPressure_bar: 1700, maxInjectionSpeed_cm3_s: 130 },
      { screwDiameter_mm: 50, maxShotVolume_cm3: 560, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 120 },
      { screwDiameter_mm: 55, maxShotVolume_cm3: 680, maxInjectionPressure_bar: 1500, maxInjectionSpeed_cm3_s: 110 },
    ],
  },

  {
    id: "arburg-630-c-4000",
    nome: "Arburg 630 C 4000",
    tonnellaggio_kN: 400,
    injectionUnits: [
      { screwDiameter_mm: 50, maxShotVolume_cm3: 600, maxInjectionPressure_bar: 1600, maxInjectionSpeed_cm3_s: 110 },
      { screwDiameter_mm: 55, maxShotVolume_cm3: 750, maxInjectionPressure_bar: 1500, maxInjectionSpeed_cm3_s: 100 },
      { screwDiameter_mm: 60, maxShotVolume_cm3: 900, maxInjectionPressure_bar: 1400, maxInjectionSpeed_cm3_s: 90 },
    ],
  },

  {
    id: "arburg-720-c-5000",
    nome: "Arburg 720 C 5000",
    tonnellaggio_kN: 500,
    injectionUnits: [
      { screwDiameter_mm: 55, maxShotVolume_cm3: 800, maxInjectionPressure_bar: 1500, maxInjectionSpeed_cm3_s: 90 },
      { screwDiameter_mm: 60, maxShotVolume_cm3: 950, maxInjectionPressure_bar: 1400, maxInjectionSpeed_cm3_s: 85 },
      { screwDiameter_mm: 70, maxShotVolume_cm3: 1300, maxInjectionPressure_bar: 1300, maxInjectionSpeed_cm3_s: 75 },
    ],
  },

];

export default arburgPressCatalog;

// Helper per ottenere unità specifica
export function getMachineInputFromArburg(id: string, screwDiameter_mm: number) {
  const m = arburgPressCatalog.find((x) => x.id === id);
  if (!m) return null;
  const unit = m.injectionUnits.find((u) => u.screwDiameter_mm === screwDiameter_mm);
  if (!unit) return null;

  return {
    id: m.id,
    nome: m.nome,
    tonnellaggio_kN: m.tonnellaggio_kN,
    screwDiameter_mm: unit.screwDiameter_mm,
    maxShotVolume_cm3: unit.maxShotVolume_cm3,
    maxInjectionSpeed_cm3_s: unit.maxInjectionSpeed_cm3_s,
    maxInjectionPressure_bar: unit.maxInjectionPressure_bar,
  };
}
