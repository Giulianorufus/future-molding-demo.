export type PressBrand = "arburg" | "engel" | "bmb" | "toyo";

export interface PressProfile {
  id: string;
  brand: PressBrand;
  label: string;
  clampForceTon: number;
  screwDiameters: number[]; // mm
  // optional machine capabilities
  shotVolumeCm3?: number;
  maxSpeedCm3s?: number;
  maxPressureBar?: number;
  maxScrewRpm?: number;
  safetyMarginPercent?: number;
}

export const PRESS_PROFILES: PressProfile[] = [
  {
    id: "arburg-370u",
    brand: "arburg",
    label: "Arburg 370U 700-290",
    clampForceTon: 70,
    screwDiameters: [18, 22, 25],
    shotVolumeCm3: 120,
    maxSpeedCm3s: 200,
    maxPressureBar: 1200,
    maxScrewRpm: 300,
    safetyMarginPercent: 10,
  },
  {
    id: "arburg-420c",
    brand: "arburg",
    label: "Arburg 420C 1000-350",
    clampForceTon: 100,
    screwDiameters: [22, 25, 30],
    shotVolumeCm3: 200,
    maxSpeedCm3s: 260,
    maxPressureBar: 1400,
    maxScrewRpm: 320,
    safetyMarginPercent: 10,
  },
  {
    id: "engel-220",
    brand: "engel",
    label: "Engel Victory 220",
    clampForceTon: 80,
    screwDiameters: [22, 25],
    shotVolumeCm3: 150,
    maxSpeedCm3s: 220,
    maxPressureBar: 1300,
    maxScrewRpm: 300,
    safetyMarginPercent: 10,
  },
  {
    id: "bmb-130",
    brand: "bmb",
    label: "BMB eKW 130",
    clampForceTon: 130,
    screwDiameters: [25, 30],
    shotVolumeCm3: 250,
    maxSpeedCm3s: 300,
    maxPressureBar: 1600,
    maxScrewRpm: 350,
    safetyMarginPercent: 10,
  },
  {
    id: "toyo-110",
    brand: "toyo",
    label: "Toyo Si-110",
    clampForceTon: 110,
    screwDiameters: [22, 25],
    shotVolumeCm3: 180,
    maxSpeedCm3s: 240,
    maxPressureBar: 1350,
    maxScrewRpm: 310,
    safetyMarginPercent: 10,
  },
];

export function getPressById(id: string | null | undefined): PressProfile | undefined {
  if (!id) return undefined;
  return PRESS_PROFILES.find((p) => p.id === id);
}

// Gruppo per marca: utilità per popolare Marca -> Modello in UI
export type PressBrandsMap = {
  [brandDisplayName: string]: {
    modelli: Array<{
      id: string;
      nome: string;
      vite: number[];
    }>;
  };
};

export const PRESS_BRANDS: PressBrandsMap = PRESS_PROFILES.reduce((acc, p) => {
  const brandDisplay = p.brand.charAt(0).toUpperCase() + p.brand.slice(1);
  if (!acc[brandDisplay]) acc[brandDisplay] = { modelli: [] };
  acc[brandDisplay].modelli.push({ id: p.id, nome: p.label, vite: p.screwDiameters });
  return acc;
}, {} as PressBrandsMap);
