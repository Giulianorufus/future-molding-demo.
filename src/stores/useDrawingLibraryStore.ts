import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedDrawing {
  id: string;
  fileName: string;
  glbUrl: string | null;
  volumeCm3: number | null;
  createdAt: number;
}

interface DrawingLibraryState {
  drawings: SavedDrawing[];
  addDrawing: (d: Omit<SavedDrawing, "id" | "createdAt">) => void;
  removeDrawing: (id: string) => void;
  clear: () => void;
}

export const useDrawingLibraryStore = create(
  persist<DrawingLibraryState>(
    (set) => ({
      drawings: [],

      addDrawing: (d) =>
        set((s) => ({
          drawings: [
            {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              ...d,
            },
            ...s.drawings,
          ],
        })),

      removeDrawing: (id) =>
        set((s) => ({
          drawings: s.drawings.filter((x) => x.id !== id),
        })),

      clear: () => set({ drawings: [] }),
    }),
    {
      name: "fm-drawing-library",
    }
  )
);
