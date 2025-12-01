import { create } from "zustand";
import { calcolaParametri } from "../engine/calcEngine";
import type { CalcOutput, GeometryInput } from "../engine/calcTypes";

// Cataloghi nuovi
import arburgPressCatalog, {
  getMachineInputFromArburg,
} from "../data/arburgPressCatalog";

import materialCatalog, {
  getMaterialInput,
} from "../data/materialCatalog";

// Se usi il loader CAD:
import { loadCadModel } from "../cad";
import type { CadAnalysisResult } from "../cad/types";

// Se hai DefectAI:
import { defectRules } from "../ai/defectRules";

interface ParametriState {
  // selezioni operatore
  pressaId: string | null; // id ArburgMachine
  screwDiameter_mm: number | null; // vite scelta
  materialeId: string | null; // id MaterialSpec

  // CAD
  geometry: GeometryInput | null;
  viewerUrl: string | null;

  // risultato calcolo
  calculated: CalcOutput | null;

  // difetti
  defect: string | null;

  // azioni
  setPressaId: (id: string | null) => void;
  setScrewDiameter: (d: number | null) => void;
  setMaterialeId: (id: string | null) => void;
  setDefect: (d: string | null) => void;

  loadCad: (file: File) => Promise<void>;
  calculate: () => void;
  applyDefectFix: () => void;
}

export const useParametriStore = create<ParametriState>((set, get) => ({
  pressaId: null,
  screwDiameter_mm: null,
  materialeId: null,

  geometry: null,
  viewerUrl: null,

  calculated: null,
  defect: null,

  setPressaId: (id) =>
    set({
      pressaId: id,
      // se cambio pressa, azzero vite
      screwDiameter_mm: null,
    }),

  setScrewDiameter: (d) => set({ screwDiameter_mm: d }),

  setMaterialeId: (id) => set({ materialeId: id }),

  setDefect: (d) => set({ defect: d }),

  async loadCad(file) {
    const res: CadAnalysisResult = await loadCadModel(file);

    // manteniamo campi compatibili sia con le nuove unità (_cm3/_cm2/_mm)
    // sia con il vecchio codice che legge `volumePezzo`, `areaProiettata`, `spessoreMedio`.
    const geometryCompat = {
      // nuovi campi con unità
      volumePezzo_cm3: res.volumeCm3 ?? 0,
      volumeMaterozza_cm3: 0,
      volumeTotale_cm3: res.volumeCm3 ?? 0,
      areaProiettata_cm2: res.areaApproxCm2 ?? 0,
      spessoreMedio_mm: res.thicknessAvgMm ?? 2,
      // campi di compatibilità (senza suffisso) per UI legacy
      volumePezzo: res.volumeCm3 ?? 0,
      volumeMaterozza: 0,
      volumeTotale: res.volumeCm3 ?? 0,
      areaProiettata: res.areaApproxCm2 ?? 0,
      spessoreMedio: res.thicknessAvgMm ?? 2,
    };

    // cast a `any` per evitare errori temporanei di compatibilità tipale,
    // mantenendo il payload completo. Idealmente aggiornare i componenti UI.
    set({ geometry: geometryCompat as any, viewerUrl: res.viewerUrl });
  },

  calculate() {
    const state = get();

    if (!state.geometry) {
      console.warn("Nessuna geometria disponibile (CAD non caricato).");
      return;
    }
    if (!state.pressaId || !state.screwDiameter_mm) {
      console.warn("Seleziona pressa Arburg e diametro vite prima del calcolo.");
      return;
    }
    if (!state.materialeId) {
      console.warn("Seleziona materiale prima del calcolo.");
      return;
    }

    // Mappa pressa Arburg -> MachineInput
    const machine = getMachineInputFromArburg(
      state.pressaId,
      state.screwDiameter_mm
    );
    if (!machine) {
      console.warn(
        `Nessun MachineInput trovato per pressa=${state.pressaId}, vite=${state.screwDiameter_mm}mm`
      );
      return;
    }

    // Mappa materiale -> MaterialInput
    const material = getMaterialInput(state.materialeId);
    if (!material) {
      console.warn(`Materiale non trovato: ${state.materialeId}`);
      return;
    }

    const input = {
      geometry: state.geometry,
      machine,
      material,
    };

    const result = calcolaParametri(input as any);
    set({ calculated: result });
  },

  applyDefectFix() {
    const state = get();
    if (!state.defect || !state.calculated) return;

    const rule = defectRules[state.defect];
    if (!rule) {
      console.warn(`Nessuna regola DefectAI per: ${state.defect}`);
      return;
    }

    const updated = rule(state.calculated);
    set({ calculated: updated });
  },
}));

export default useParametriStore;
