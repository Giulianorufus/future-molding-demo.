// Catalogo materiali Future Molding — 20 materiali tecnici
// Compatibile con calcEngine / calcTypes

import type { MaterialInput } from "../engine/calcTypes";

export interface MaterialSpec {
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
  version?: string;
  source?: string;
}

const materialCatalog: MaterialSpec[] = [

  // -----------------------------------------
  // 1. PP Homopolimero
  // -----------------------------------------
  {
    id: "PP-HOMO",
    nome: "PP Homopolimero",
    density_g_cm3: 0.90,
    shrinkage_percent: 1.8,
    vpFactor: 0.88,
    packPressure_bar: 350,
    packTime_s: 0.8,
    tempCylStart_C: 180,
    tempCylMid_C: 200,
    tempCylEnd_C: 215,
    tempMold_C: 35,
    tempNozzle_C: 200,
    speedBase_cm3_s: 90,
    viscosityFactor: 0.8,
  },

  // -----------------------------------------
  // 2. PP Copolimero
  // -----------------------------------------
  {
    id: "PP-COPO",
    nome: "PP Copolimero",
    density_g_cm3: 0.90,
    shrinkage_percent: 1.6,
    vpFactor: 0.88,
    packPressure_bar: 380,
    packTime_s: 0.9,
    tempCylStart_C: 185,
    tempCylMid_C: 205,
    tempCylEnd_C: 220,
    tempMold_C: 40,
    tempNozzle_C: 210,
    speedBase_cm3_s: 85,
    viscosityFactor: 0.85,
  },

  // -----------------------------------------
  // 3. ABS
  // -----------------------------------------
  {
    id: "ABS",
    nome: "ABS",
    density_g_cm3: 1.04,
    shrinkage_percent: 0.7,
    vpFactor: 0.92,
    packPressure_bar: 450,
    packTime_s: 1.0,
    tempCylStart_C: 220,
    tempCylMid_C: 235,
    tempCylEnd_C: 245,
    tempMold_C: 65,
    tempNozzle_C: 235,
    speedBase_cm3_s: 70,
    viscosityFactor: 1.1,
  },

  // -----------------------------------------
  // 4. PC
  // -----------------------------------------
  {
    id: "PC",
    nome: "Policarbonato (PC)",
    density_g_cm3: 1.20,
    shrinkage_percent: 0.6,
    vpFactor: 0.93,
    packPressure_bar: 550,
    packTime_s: 1.2,
    tempCylStart_C: 260,
    tempCylMid_C: 280,
    tempCylEnd_C: 300,
    tempMold_C: 90,
    tempNozzle_C: 285,
    speedBase_cm3_s: 55,
    viscosityFactor: 1.3,
  },

  // -----------------------------------------
  // 5. PC/ABS
  // -----------------------------------------
  {
    id: "PCABS",
    nome: "PC/ABS",
    density_g_cm3: 1.15,
    shrinkage_percent: 0.6,
    vpFactor: 0.93,
    packPressure_bar: 500,
    packTime_s: 1.1,
    tempCylStart_C: 240,
    tempCylMid_C: 260,
    tempCylEnd_C: 270,
    tempMold_C: 80,
    tempNozzle_C: 265,
    speedBase_cm3_s: 60,
    viscosityFactor: 1.2,
  },

  // -----------------------------------------
  // 6. PA6
  // -----------------------------------------
  {
    id: "PA6",
    nome: "PA6",
    density_g_cm3: 1.13,
    shrinkage_percent: 1.0,
    vpFactor: 0.92,
    packPressure_bar: 600,
    packTime_s: 1.3,
    tempCylStart_C: 235,
    tempCylMid_C: 255,
    tempCylEnd_C: 270,
    tempMold_C: 70,
    tempNozzle_C: 260,
    speedBase_cm3_s: 70,
    viscosityFactor: 1.25,
  },

  // -----------------------------------------
  // 7. PA66
  // -----------------------------------------
  {
    id: "PA66",
    nome: "PA66",
    density_g_cm3: 1.15,
    shrinkage_percent: 1.0,
    vpFactor: 0.92,
    packPressure_bar: 620,
    packTime_s: 1.4,
    tempCylStart_C: 255,
    tempCylMid_C: 270,
    tempCylEnd_C: 285,
    tempMold_C: 75,
    tempNozzle_C: 270,
    speedBase_cm3_s: 65,
    viscosityFactor: 1.3,
  },

  // -----------------------------------------
  // 8. PA66 + GF30
  // -----------------------------------------
  {
    id: "PA66GF30",
    nome: "PA66 + GF30",
    density_g_cm3: 1.35,
    shrinkage_percent: 0.3,
    vpFactor: 0.90,
    packPressure_bar: 650,
    packTime_s: 1.4,
    tempCylStart_C: 260,
    tempCylMid_C: 275,
    tempCylEnd_C: 290,
    tempMold_C: 80,
    tempNozzle_C: 280,
    speedBase_cm3_s: 65,
    viscosityFactor: 1.35,
  },

  // -----------------------------------------
  // 9. PA6 + GF30
  // -----------------------------------------
  {
    id: "PA6GF30",
    nome: "PA6 + GF30",
    density_g_cm3: 1.28,
    shrinkage_percent: 0.4,
    vpFactor: 0.90,
    packPressure_bar: 620,
    packTime_s: 1.3,
    tempCylStart_C: 250,
    tempCylMid_C: 265,
    tempCylEnd_C: 280,
    tempMold_C: 80,
    tempNozzle_C: 270,
    speedBase_cm3_s: 70,
    viscosityFactor: 1.32,
  },

  // -----------------------------------------
  // 10. POM (Acetalico)
  // -----------------------------------------
  {
    id: "POM",
    nome: "POM",
    density_g_cm3: 1.41,
    shrinkage_percent: 2.0,
    vpFactor: 0.88,
    packPressure_bar: 350,
    packTime_s: 0.9,
    tempCylStart_C: 180,
    tempCylMid_C: 195,
    tempCylEnd_C: 205,
    tempMold_C: 80,
    tempNozzle_C: 200,
    speedBase_cm3_s: 90,
    viscosityFactor: 0.9,
  },

  // -----------------------------------------
  // 11. PS
  // -----------------------------------------
  {
    id: "PS",
    nome: "Polistirene (PS)",
    density_g_cm3: 1.05,
    shrinkage_percent: 0.6,
    vpFactor: 0.95,
    packPressure_bar: 300,
    packTime_s: 0.8,
    tempCylStart_C: 190,
    tempCylMid_C: 210,
    tempCylEnd_C: 225,
    tempMold_C: 40,
    tempNozzle_C: 215,
    speedBase_cm3_s: 85,
    viscosityFactor: 0.85,
  },

  // -----------------------------------------
  // 12. SAN
  // -----------------------------------------
  {
    id: "SAN",
    nome: "SAN",
    density_g_cm3: 1.07,
    shrinkage_percent: 0.6,
    vpFactor: 0.94,
    packPressure_bar: 350,
    packTime_s: 0.9,
    tempCylStart_C: 185,
    tempCylMid_C: 205,
    tempCylEnd_C: 215,
    tempMold_C: 50,
    tempNozzle_C: 210,
    speedBase_cm3_s: 80,
    viscosityFactor: 0.90,
  },

  // -----------------------------------------
  // 13. PMMA
  // -----------------------------------------
  {
    id: "PMMA",
    nome: "PMMA",
    density_g_cm3: 1.18,
    shrinkage_percent: 0.4,
    vpFactor: 0.93,
    packPressure_bar: 500,
    packTime_s: 1.1,
    tempCylStart_C: 220,
    tempCylMid_C: 235,
    tempCylEnd_C: 250,
    tempMold_C: 70,
    tempNozzle_C: 240,
    speedBase_cm3_s: 60,
    viscosityFactor: 1.15,
  },

  // -----------------------------------------
  // 14. TPU
  // -----------------------------------------
  {
    id: "TPU",
    nome: "TPU",
    density_g_cm3: 1.20,
    shrinkage_percent: 1.2,
    vpFactor: 0.90,
    packPressure_bar: 400,
    packTime_s: 1.0,
    tempCylStart_C: 180,
    tempCylMid_C: 195,
    tempCylEnd_C: 205,
    tempMold_C: 45,
    tempNozzle_C: 200,
    speedBase_cm3_s: 70,
    viscosityFactor: 1.0,
  },

  // -----------------------------------------
  // 15. TPE
  // -----------------------------------------
  {
    id: "TPE",
    nome: "TPE",
    density_g_cm3: 0.95,
    shrinkage_percent: 1.6,
    vpFactor: 0.88,
    packPressure_bar: 350,
    packTime_s: 0.8,
    tempCylStart_C: 170,
    tempCylMid_C: 185,
    tempCylEnd_C: 195,
    tempMold_C: 40,
    tempNozzle_C: 190,
    speedBase_cm3_s: 75,
    viscosityFactor: 1.05,
  },

  // -----------------------------------------
  // 16. PE-HD
  // -----------------------------------------
  {
    id: "PEHD",
    nome: "PE-HD",
    density_g_cm3: 0.95,
    shrinkage_percent: 2.0,
    vpFactor: 0.88,
    packPressure_bar: 300,
    packTime_s: 0.9,
    tempCylStart_C: 170,
    tempCylMid_C: 190,
    tempCylEnd_C: 210,
    tempMold_C: 30,
    tempNozzle_C: 200,
    speedBase_cm3_s: 100,
    viscosityFactor: 0.75,
  },

  // -----------------------------------------
  // 17. PE-LD
  // -----------------------------------------
  {
    id: "PELD",
    nome: "PE-LD",
    density_g_cm3: 0.92,
    shrinkage_percent: 2.2,
    vpFactor: 0.88,
    packPressure_bar: 280,
    packTime_s: 0.8,
    tempCylStart_C: 165,
    tempCylMid_C: 185,
    tempCylEnd_C: 200,
    tempMold_C: 30,
    tempNozzle_C: 190,
    speedBase_cm3_s: 105,
    viscosityFactor: 0.7,
  },

  // -----------------------------------------
  // 18. PBT
  // -----------------------------------------
  {
    id: "PBT",
    nome: "PBT",
    density_g_cm3: 1.31,
    shrinkage_percent: 1.2,
    vpFactor: 0.92,
    packPressure_bar: 550,
    packTime_s: 1.1,
    tempCylStart_C: 220,
    tempCylMid_C: 240,
    tempCylEnd_C: 255,
    tempMold_C: 70,
    tempNozzle_C: 245,
    speedBase_cm3_s: 65,
    viscosityFactor: 1.2,
  },

  // -----------------------------------------
  // 19. PPS
  // -----------------------------------------
  {
    id: "PPS",
    nome: "PPS",
    density_g_cm3: 1.35,
    shrinkage_percent: 0.3,
    vpFactor: 0.92,
    packPressure_bar: 650,
    packTime_s: 1.3,
    tempCylStart_C: 280,
    tempCylMid_C: 300,
    tempCylEnd_C: 315,
    tempMold_C: 80,
    tempNozzle_C: 305,
    speedBase_cm3_s: 50,
    viscosityFactor: 1.45,
  },

  // -----------------------------------------
  // 20. LCP
  // -----------------------------------------
  {
    id: "LCP",
    nome: "LCP",
    density_g_cm3: 1.35,
    shrinkage_percent: 0.2,
    vpFactor: 0.94,
    packPressure_bar: 700,
    packTime_s: 1.1,
    tempCylStart_C: 260,
    tempCylMid_C: 280,
    tempCylEnd_C: 300,
    tempMold_C: 120,
    tempNozzle_C: 285,
    speedBase_cm3_s: 45,
    viscosityFactor: 1.5,
  },

];

export default materialCatalog;

/**
 * Helper per il motore matematico
 */
export function getMaterialInput(id: string) {
  return materialCatalog.find((m) => m.id === id) || null;
}
