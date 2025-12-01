import { create } from "zustand";

export type DefectPoint = {
  id: string;
  type: string;    // tipo difetto (es. "Riempimento incompleto")
  x: number;       // coordinate normalizzate 0..1
  y: number;
  note?: string;
};

type DefectsState = {
  points: DefectPoint[];
  addPoint: (point: Omit<DefectPoint, "id">) => void;
  removePoint: (id: string) => void;
  clearAll: () => void;
  updatePoint: (id: string, updates: Partial<DefectPoint>) => void;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useDefectsStore = create<DefectsState>((set, get) => ({
  points: [],
  
  addPoint: (point) => {
    const newPoint: DefectPoint = {
      ...point,
      id: generateId(),
    };
    set((state) => ({
      points: [...state.points, newPoint],
    }));
  },
  
  removePoint: (id) => {
    set((state) => ({
      points: state.points.filter((p) => p.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ points: [] });
  },
  
  updatePoint: (id, updates) => {
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
}));