// src/data/materialLibrary.ts
export type MaterialFamily = "PP" | "ABS" | "PC" | "PA6" | "PA66";
export type ViscosityClass = "low" | "medium" | "high";

export interface RangeC {
  min: number;
  max: number;
  typical: number;
}

export interface ShrinkPercentRange {
  min: number;
  max: number;
  typical: number;
}

export interface MaterialReinforcement {
  type: "GF";
  pct: 30 | 60;
}

export interface MaterialFactors {
  // moltiplicatori deterministici (baseline 1.00)
  // flow: influenza velocità/portata; pressure: pressione; cooling: raffreddamento
  flow: number;
  pressure: number;
  cooling: number;
}

export interface MaterialProfile {
  id: string; // es: "PA66-GF30"
  name: string; // label UI
  family: MaterialFamily;
  reinforcement?: MaterialReinforcement;

  density_g_cm3: number;

  meltTemp_C: RangeC; // cilindro/melt indicativo
  moldTemp_C: RangeC; // stampo
  shrink_percent: ShrinkPercentRange;

  // MVR opzionale: se non noto, si usa viscosityClass
  mvr_g_10min?: { min: number; max: number; typical: number };
  viscosityClass: ViscosityClass;

  factors: MaterialFactors;

  notes?: string[];
  version: string;
  source?: string;
}

const VERSION = "materials-v1";

// Nota: valori “di lavoro” (range industriali comuni) + moltiplicatori coerenti
// Non sono schede tecniche di un brand specifico: sono baseline per calcolo automatico.
const LIB: readonly MaterialProfile[] = [
  // -------------------- PP --------------------
  {
    id: "PP",
    name: "PP (Polipropilene)",
    family: "PP",
    density_g_cm3: 0.90,
    meltTemp_C: { min: 190, max: 240, typical: 220 },
    moldTemp_C: { min: 20, max: 60, typical: 40 },
    shrink_percent: { min: 1.2, max: 2.2, typical: 1.6 },
    mvr_g_10min: { min: 8, max: 35, typical: 20 },
    viscosityClass: "low",
    factors: { flow: 1.15, pressure: 0.90, cooling: 0.95 },
    notes: ["Tende a ritirare (shrink alto).", "Buona fluidità, pressione mediamente più bassa."],
    version: VERSION,
  },

  // -------------------- ABS --------------------
  {
    id: "ABS",
    name: "ABS",
    family: "ABS",
    density_g_cm3: 1.04,
    meltTemp_C: { min: 220, max: 260, typical: 240 },
    moldTemp_C: { min: 50, max: 80, typical: 60 },
    shrink_percent: { min: 0.4, max: 0.8, typical: 0.6 },
    mvr_g_10min: { min: 5, max: 25, typical: 12 },
    viscosityClass: "medium",
    factors: { flow: 1.00, pressure: 1.00, cooling: 1.00 },
    notes: ["Baseline neutra per fallback."],
    version: VERSION,
  },

  // -------------------- PC --------------------
  {
    id: "PC",
    name: "PC (Policarbonato)",
    family: "PC",
    density_g_cm3: 1.20,
    meltTemp_C: { min: 260, max: 320, typical: 295 },
    moldTemp_C: { min: 80, max: 120, typical: 100 },
    shrink_percent: { min: 0.5, max: 0.7, typical: 0.6 },
    mvr_g_10min: { min: 6, max: 18, typical: 10 },
    viscosityClass: "high",
    factors: { flow: 0.85, pressure: 1.20, cooling: 1.10 },
    notes: ["Richiede pressioni più alte.", "Stampo caldo per estetica e riduzione stress."],
    version: VERSION,
  },

  // -------------------- PA6 --------------------
  {
    id: "PA6",
    name: "PA6 (Nylon 6)",
    family: "PA6",
    density_g_cm3: 1.13,
    meltTemp_C: { min: 230, max: 270, typical: 250 },
    moldTemp_C: { min: 60, max: 90, typical: 80 },
    shrink_percent: { min: 0.8, max: 1.6, typical: 1.2 },
    viscosityClass: "medium",
    factors: { flow: 0.90, pressure: 1.10, cooling: 1.05 },
    notes: ["Sensibile all’umidità: essiccazione importante."],
    version: VERSION,
  },

  // -------------------- PA66 --------------------
  {
    id: "PA66",
    name: "PA66 (Nylon 66)",
    family: "PA66",
    density_g_cm3: 1.14,
    meltTemp_C: { min: 260, max: 300, typical: 280 },
    moldTemp_C: { min: 70, max: 110, typical: 90 },
    shrink_percent: { min: 0.9, max: 1.8, typical: 1.3 },
    viscosityClass: "high",
    factors: { flow: 0.88, pressure: 1.15, cooling: 1.08 },
    notes: ["Più esigente di PA6 su temperature e pressione."],
    version: VERSION,
  },

  // -------------------- PA6 + GF --------------------
  {
    id: "PA6-GF30",
    name: "PA6 GF30",
    family: "PA6",
    reinforcement: { type: "GF", pct: 30 },
    density_g_cm3: 1.36,
    meltTemp_C: { min: 245, max: 285, typical: 265 },
    moldTemp_C: { min: 70, max: 100, typical: 85 },
    shrink_percent: { min: 0.3, max: 0.8, typical: 0.5 },
    viscosityClass: "high",
    factors: { flow: 0.80, pressure: 1.25, cooling: 1.20 },
    notes: ["GF aumenta viscosità: più pressione e più tempo/raffreddamento."],
    version: VERSION,
  },
  {
    id: "PA6-GF60",
    name: "PA6 GF60",
    family: "PA6",
    reinforcement: { type: "GF", pct: 60 },
    density_g_cm3: 1.55,
    meltTemp_C: { min: 250, max: 295, typical: 275 },
    moldTemp_C: { min: 80, max: 110, typical: 95 },
    shrink_percent: { min: 0.2, max: 0.6, typical: 0.4 },
    viscosityClass: "high",
    factors: { flow: 0.70, pressure: 1.40, cooling: 1.35 },
    notes: ["GF60: molto denso e viscoso, attenzione limiti pressa."],
    version: VERSION,
  },

  // -------------------- PA66 + GF --------------------
  {
    id: "PA66-GF30",
    name: "PA66 GF30",
    family: "PA66",
    reinforcement: { type: "GF", pct: 30 },
    density_g_cm3: 1.37,
    meltTemp_C: { min: 270, max: 310, typical: 290 },
    moldTemp_C: { min: 80, max: 110, typical: 95 },
    shrink_percent: { min: 0.3, max: 0.8, typical: 0.5 },
    viscosityClass: "high",
    factors: { flow: 0.78, pressure: 1.28, cooling: 1.22 },
    version: VERSION,
  },
  {
    id: "PA66-GF60",
    name: "PA66 GF60",
    family: "PA66",
    reinforcement: { type: "GF", pct: 60 },
    density_g_cm3: 1.56,
    meltTemp_C: { min: 275, max: 320, typical: 300 },
    moldTemp_C: { min: 90, max: 120, typical: 105 },
    shrink_percent: { min: 0.2, max: 0.6, typical: 0.4 },
    viscosityClass: "high",
    factors: { flow: 0.68, pressure: 1.42, cooling: 1.36 },
    version: VERSION,
  },
] as const;

export const materialLibrary = {
  version: VERSION,
  all(): readonly MaterialProfile[] {
    return LIB;
  },
  byId(id: string): MaterialProfile | undefined {
    const norm = normalizeMaterialId(id);
    return LIB.find((m) => m.id === norm);
  },
  ids(): string[] {
    return LIB.map((m) => m.id);
  },
};

export function normalizeMaterialId(id: string): string {
  const raw = (id ?? "").trim().toUpperCase();

  // normalizzazioni comuni
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/_/g, "-")
    .replace(/GF(\d{2})/g, "GF$1");

  // PA66GF30 -> PA66-GF30
  const gfMatch = cleaned.match(/^(PA6|PA66)[-]?GF(30|60)$/);
  if (gfMatch) return `${gfMatch[1]}-GF${gfMatch[2]}`;

  // PC/ABS blend non supportato: lo lasciamo com'è per fallback esterno
  return cleaned;
}

export function resolveMaterialOrFallback(inputId?: string): {
  material: MaterialProfile;
  assumptions: string[];
} {
  const assumptions: string[] = [];
  if (!inputId) {
    assumptions.push("Materiale non selezionato: uso fallback ABS.");
    return { material: materialLibrary.byId("ABS")!, assumptions };
  }

  const found = materialLibrary.byId(inputId);
  if (found) return { material: found, assumptions };

  assumptions.push(`Materiale sconosciuto "${inputId}": uso fallback ABS.`);
  return { material: materialLibrary.byId("ABS")!, assumptions };
}
