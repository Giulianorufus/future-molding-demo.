import { create } from "zustand";

// Defect pin shape used by InteractiveCanvas and DefectsList
export type DefectPin = {
  id: string;
  face: "front" | "back";
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  rotation_deg: 0 | 90 | 180 | 270;
  defect: string; // defect type label
  severity: number; // 1..5
  notes?: string;
};

type DefectsState = {
  pins: DefectPin[];
  selectedPin: string | null;
  addPin: (p: Omit<DefectPin, "id">) => void;
  removePin: (id: string) => void;
  updatePin: (id: string, updates: Partial<DefectPin>) => void;
  clearAll: () => void;
  setSelectedPin: (id: string | null) => void;
};

const genId = () => Math.random().toString(36).slice(2, 10);

export const useDefectsStore = create<DefectsState>((set, get) => ({
  pins: [],
  selectedPin: null,

  addPin: (p) => {
    const newPin: DefectPin = { ...p, id: genId() } as DefectPin;
    set((state) => ({ pins: [...state.pins, newPin] }));
    set(() => ({ selectedPin: newPin.id }));
  },

  removePin: (id) => {
    set((state) => ({ pins: state.pins.filter((x) => x.id !== id) }));
    const sel = get().selectedPin;
    if (sel === id) set({ selectedPin: null });
  },

  updatePin: (id, updates) => {
    set((state) => ({
      pins: state.pins.map((x) => (x.id === id ? { ...x, ...updates } : x)),
    }));
  },

  clearAll: () => set({ pins: [], selectedPin: null }),

  setSelectedPin: (id) => set({ selectedPin: id }),
}));