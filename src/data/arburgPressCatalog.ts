// Catalogo Arburg 150 kN → 1000 kN
// Versione Future Molding — compatibile con calcEngine

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
      {
        screwDiameter_mm: 18,
        maxShotVolume_cm3: 28,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 140,
      },
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 52,
        maxInjectionPressure_bar: 1950,
        maxInjectionSpeed_cm3_s: 160,
      },
    ],
  },

  // ---------------------------------------------------------
  // 270 — circa 250 kN
  // ---------------------------------------------------------
  {
    id: "arburg-270-c",
    nome: "Arburg 270 C",
    tonnellaggio_kN: 250,
    injectionUnits: [
      {
        screwDiameter_mm: 18,
        maxShotVolume_cm3: 40,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 160,
      },
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 72,
        maxInjectionPressure_bar: 1950,
        maxInjectionSpeed_cm3_s: 180,
      },
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 110,
        maxInjectionPressure_bar: 1850,
        maxInjectionSpeed_cm3_s: 200,
      },
    ],
  },

  // ---------------------------------------------------------
  // 320 — circa 350 kN
  // ---------------------------------------------------------
  {
    id: "arburg-320-c",
    nome: "Arburg 320 C",
    tonnellaggio_kN: 350,
    injectionUnits: [
      {
        screwDiameter_mm: 18,
        maxShotVolume_cm3: 52,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 160,
      },
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 92,
        maxInjectionPressure_bar: 2050,
        maxInjectionSpeed_cm3_s: 190,
      },
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 135,
        maxInjectionPressure_bar: 1950,
        maxInjectionSpeed_cm3_s: 210,
      },
    ],
  },

  // ---------------------------------------------------------
  // 370 — 400–500 kN
  // ---------------------------------------------------------
  {
    id: "arburg-370-u",
    nome: "Arburg 370 U",
    tonnellaggio_kN: 400,
    injectionUnits: [
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 92,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 200,
      },
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 135,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 220,
      },
    ],
  },

  {
    id: "arburg-370-c",
    nome: "Arburg 370 C",
    tonnellaggio_kN: 500,
    injectionUnits: [
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 110,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 210,
      },
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 150,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 230,
      },
      {
        screwDiameter_mm: 35,
        maxShotVolume_cm3: 220,
        maxInjectionPressure_bar: 1900,
        maxInjectionSpeed_cm3_s: 250,
      },
    ],
  },

  // ---------------------------------------------------------
  // 420 — 700–1000 kN
  // ---------------------------------------------------------

  {
    id: "arburg-420-c",
    nome: "Arburg 420 C",
    tonnellaggio_kN: 700,
    injectionUnits: [
      {
        screwDiameter_mm: 25,
        maxShotVolume_cm3: 110,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 210,
      },
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 150,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 230,
      },
      {
        screwDiameter_mm: 35,
        maxShotVolume_cm3: 220,
        maxInjectionPressure_bar: 1900,
        maxInjectionSpeed_cm3_s: 250,
      },
      {
        screwDiameter_mm: 40,
        maxShotVolume_cm3: 320,
        maxInjectionPressure_bar: 1800,
        maxInjectionSpeed_cm3_s: 260,
      },
    ],
  },

  {
    id: "arburg-420-h",
    nome: "Arburg 420 H (Ibrida)",
    tonnellaggio_kN: 1000,
    injectionUnits: [
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 150,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3_s: 260,
      },
      {
        screwDiameter_mm: 35,
        maxShotVolume_cm3: 220,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 280,
      },
      {
        screwDiameter_mm: 40,
        maxShotVolume_cm3: 320,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 300,
      },
    ],
  },

  // ---------------------------------------------------------
  // 470 — 1000 kN
  // ---------------------------------------------------------

  {
    id: "arburg-470-c",
    nome: "Arburg 470 C",
    tonnellaggio_kN: 1000,
    injectionUnits: [
      {
        screwDiameter_mm: 30,
        maxShotVolume_cm3: 150,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3_s: 260,
      },
      {
        screwDiameter_mm: 35,
        maxShotVolume_cm3: 220,
        maxInjectionPressure_bar: 2100,
        maxInjectionSpeed_cm3_s: 280,
      },
      {
        screwDiameter_mm: 40,
        maxShotVolume_cm3: 320,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 300,
      },
    ],
  },

];

export default arburgPressCatalog;

/**
 * Helper ufficiale per Future Molding
 */
export function getMachineInputFromArburg(
  id: string,
  screwDiameter_mm: number
) {
  const m = arburgPressCatalog.find((x) => x.id === id);
  if (!m) return null;

  const unit = m.injectionUnits.find(
    (u) => u.screwDiameter_mm === screwDiameter_mm
  );

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
