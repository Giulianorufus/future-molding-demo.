import { MachineInput } from "../engine/calcTypes";

export const pressData: MachineInput[] = [
  {
    id: "arburg-370u-70t",
    nome: "Arburg 370U 700-350",
    tonnellaggio_kN: 700,
    maxShotVolume_cm3: 150,
    screwDiameter_mm: 25,
    maxInjectionSpeed_cm3_s: 120,
    maxInjectionPressure_bar: 2000,
  },
  {
    id: "arburg-420c-100t",
    nome: "Arburg 420C 1000-400",
    tonnellaggio_kN: 1000,
    maxShotVolume_cm3: 230,
    screwDiameter_mm: 30,
    maxInjectionSpeed_cm3_s: 160,
    maxInjectionPressure_bar: 2200,
  },
];

export default pressData;
