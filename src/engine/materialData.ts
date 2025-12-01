export type MaterialFamily = "PP" | "ABS" | "PCABS" | "PA66GF";

export interface MaterialInfo {
  id: string;
  name: string;
  family: MaterialFamily;
  meltMin: number; // °C
  meltMax: number; // °C
  moldMin: number; // °C
  moldMax: number; // °C
  viscosity: "low" | "medium" | "high";
  crystalline: boolean;
  // density in g/cm³ (optional)
  density_g_cm3?: number;
}

export const MATERIALS: MaterialInfo[] = [
  {
    id: "pp",
    name: "PP copolimero",
    family: "PP",
    meltMin: 210,
    meltMax: 240,
    moldMin: 20,
    moldMax: 40,
    viscosity: "medium",
    crystalline: true,
    density_g_cm3: 0.905,
  },
  {
    id: "abs",
    name: "ABS",
    family: "ABS",
    meltMin: 220,
    meltMax: 250,
    moldMin: 40,
    moldMax: 70,
    viscosity: "medium",
    crystalline: false,
    density_g_cm3: 1.04,
  },
  {
    id: "pcabs",
    name: "PC/ABS",
    family: "PCABS",
    meltMin: 240,
    meltMax: 270,
    moldMin: 60,
    moldMax: 80,
    viscosity: "high",
    crystalline: false,
    density_g_cm3: 1.18,
  },
  {
    id: "pa66gf",
    name: "PA66 + GF",
    family: "PA66GF",
    meltMin: 260,
    meltMax: 290,
    moldMin: 70,
    moldMax: 90,
    viscosity: "high",
    crystalline: true,
    density_g_cm3: 1.35,
  },
];

export function getMaterialById(id: string | null | undefined): MaterialInfo | undefined {
  if (!id) return undefined;
  return MATERIALS.find((m) => m.id === id);
}
