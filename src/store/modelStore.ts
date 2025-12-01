import { create } from "zustand";

export const useModelStore = create((set: any, get: any) => ({
  model3D: null as any,
  setModel3D: (mesh: any) => {
    // revoke previous URL if present to avoid memory leaks
    try {
      const prev = get().model3D;
      if (prev) {
        // prev can be an object with `url` or a string
        const url = typeof prev === "string" ? prev : (prev.url as string | undefined);
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch (_) {}
        }
      }
    } catch (_) {}

    set({ model3D: mesh });
  },
  clear: () => {
    try {
      const prev = get().model3D;
      const url = typeof prev === "string" ? prev : (prev?.url as string | undefined);
      if (url) {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }
    } catch (_) {}
    set({ model3D: null });
  }
}));
