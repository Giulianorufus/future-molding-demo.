import type { MaterialInfo } from "./materialData";

// Estensione permissiva del materiale per campi opzionali usati dagli helper
export type MaterialLike = MaterialInfo & Partial<Record<string, number | string>>;

// -------------------------------
// 1. Velocità iniezione (cm3/s)
// -------------------------------
export function calcInjectionSpeed(spessoreMedio_mm: number, materiale: MaterialLike): number {
  const base = (materiale as any).speedBase ?? 80; // alcuni materiali possono definire speedBase
  const fattoreSpessore = 4 - Math.min(3, spessoreMedio_mm / 0.5);
  return Math.round(base * (1 + fattoreSpessore * 0.12));
}

// -------------------------------
// 2. Pressione iniezione (bar)
// -------------------------------
export function calcInjectionPressure(areaProiettata: number, velocita: number, materiale: MaterialLike): number {
  // mappatura semplice della viscosità testuale in un fattore numerico
  const viscositaVal = typeof materiale.viscosity === 'string'
    ? (materiale.viscosity === 'high' ? 1.2 : materiale.viscosity === 'low' ? 0.9 : 1.0)
    : Number((materiale as any).viscosity) || 1.0;
  const pressione = (areaProiettata * viscositaVal * (velocita / 100)) * 0.9;
  return Math.round(pressione);
}

// -------------------------------
// 3. Fill Time (s)
// -------------------------------
export function calcFillTime(volumeTotale: number, velocita: number): number {
  if (velocita <= 0) return 0.1;
  return Number((volumeTotale / velocita).toFixed(2));
}

// -------------------------------
// 4. VP Volume (cm3)
// -------------------------------
export function calcVP(volumeTotale: number, materiale: MaterialLike): number {
  const fattore = (materiale as any).vpFactor ?? 0.92; // es: ABS 0.92 – PP 0.88
  return Number((volumeTotale * fattore).toFixed(2));
}

// -------------------------------
// 5. Post-pressione (Pack)
// -------------------------------
export function calcPack(materiale: MaterialLike, volumeTotale: number) {
  const pressione = (materiale as any).packPressure ?? 300;
  const tempo = (materiale as any).packTime ?? 1.2;
  return { pressione, tempo };
}

// -------------------------------
// 6. Raffreddamento (s)
// -------------------------------
export function calcCoolingTime(spessoreMedio: number): number {
  return Number((Math.pow(spessoreMedio, 2) * 1.8).toFixed(1));
}

// -------------------------------
// 7. Tonnellaggio richiesto (kN)
// -------------------------------
export function calcTonnellaggio(areaProiettata: number, pressioneIniezione: number): number {
  // nota: formula originale conservata — restituisce un valore arrotondato
  return Math.round((pressioneIniezione * areaProiettata * 0.1) / 100);
}

// -------------------------------
// 8. Temperature consigliate
// -------------------------------
export function calcTemperatures(materiale: MaterialLike) {
  return {
    z1: (materiale as any).tempCylStart ?? 200,
    z2: (materiale as any).tempCylMid ?? 210,
    z3: (materiale as any).tempCylMid ?? 220,
    z4: (materiale as any).tempCylEnd ?? 230,
    stampo: (materiale as any).tempMold ?? 60,
    ugello: (materiale as any).tempNozzle ?? 220
  };
}

export default {
  calcInjectionSpeed,
  calcInjectionPressure,
  calcFillTime,
  calcVP,
  calcPack,
  calcCoolingTime,
  calcTonnellaggio,
  calcTemperatures,
};
