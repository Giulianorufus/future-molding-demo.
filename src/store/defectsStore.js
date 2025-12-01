import { create } from "zustand";
const generateId = () => Math.random().toString(36).substr(2, 9);
export const useDefectsStore = create((set, get) => ({
    points: [],
    addPoint: (point) => {
        const newPoint = {
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
            points: state.points.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
    },
}));
