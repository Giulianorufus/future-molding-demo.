import { create } from "zustand";
import { validateFileBasic, generateAesKey, encryptFileToBlob, decryptBlobToFile } from "../utils/crypto";

export interface GeometryData {
  volumePezzo_cm3: number;
  volumeMaterozza_cm3: number | null;
  volumeTotale_cm3: number;
  areaProiettata_cm2?: number;
  spessoreMedio_mm?: number | null;
}

export type DrawingState = {
  // legacy upload area (many components still use these)
  file: File | null;
  objectUrl: string | null; // points to encrypted blob by default
  encryptionKey: CryptoKey | null;
  encryptionIv: string | null;
  setFile: (f: File | null) => Promise<void>;
  getDecryptedObjectUrl: () => Promise<string | null>;
  clear: () => void;
  selectedDrawingId: string;
  setSelectedDrawingId: (id: string) => void;

  // new drawing / geometry canonical fields
  glbUrl: string | null;
  geometry: GeometryData | null;
  isLoading: boolean;
  error: string | null;
  setGlbUrl: (url: string | null) => void;
  setGeometry: (geo: GeometryData | null) => void;
  setIsLoading: (flag: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  // legacy upload state
  file: null,
  objectUrl: null,
  encryptionKey: null,
  encryptionIv: null,
  selectedDrawingId: localStorage.getItem("fm_selectedDrawingId") || "",
  setFile: async (f) => {
    const prevUrl = get().objectUrl;
    if (prevUrl) try { URL.revokeObjectURL(prevUrl); } catch (_) {}

    if (!f) {
      set({ file: null, objectUrl: null, encryptionKey: null, encryptionIv: null });
      localStorage.removeItem("fm_drawing_name");
      return;
    }

    try {
      const v = validateFileBasic(f);
      if (!v.ok) {
        const msg = v.reason === 'extension' ? 'Formato non supportato' : 'File troppo grande';
        alert(`Upload non valido: ${msg}`);
        return;
      }
    } catch (e) {
      // ignore
    }

    let key: CryptoKey | null = null;
    try { key = await generateAesKey(); } catch (_) { key = null; }

    try {
      const { blob, iv } = await encryptFileToBlob(f, key);
      const url = URL.createObjectURL(blob);
      set({ file: f, objectUrl: url, encryptionKey: key, encryptionIv: iv ?? null });
      localStorage.setItem("fm_drawing_name", f.name);
    } catch (e) {
      const url = URL.createObjectURL(f);
      set({ file: f, objectUrl: url, encryptionKey: null, encryptionIv: null });
      localStorage.setItem("fm_drawing_name", f.name);
    }
  },
  getDecryptedObjectUrl: async () => {
    const state = get();
    if (!state.objectUrl) return null;
    try {
      const resp = await fetch(state.objectUrl);
      const encBlob = await resp.blob();
      const file = await decryptBlobToFile(encBlob, state.encryptionKey, state.encryptionIv, (state.file as any)?.name || 'drawing', (state.file as any)?.type || 'application/octet-stream');
      const decUrl = URL.createObjectURL(file);
      return decUrl;
    } catch (e) {
      return state.objectUrl;
    }
  },
  setSelectedDrawingId: (id) => {
    set({ selectedDrawingId: id });
    localStorage.setItem("fm_selectedDrawingId", id || "");
  },
  clear: () => {
    const prevUrl = get().objectUrl;
    if (prevUrl) try { URL.revokeObjectURL(prevUrl); } catch (_) {}
    set({ file: null, objectUrl: null, encryptionKey: null, encryptionIv: null, selectedDrawingId: "" });
    localStorage.removeItem("fm_drawing_name");
    localStorage.removeItem("fm_selectedDrawingId");
  },

  // canonical drawing fields
  glbUrl: null,
  geometry: null,
  isLoading: false,
  error: null,
  setGlbUrl: (glbUrl) => set({ glbUrl }),
  setGeometry: (geometry) => set({ geometry }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ glbUrl: null, geometry: null, isLoading: false, error: null }),
}));

export default useDrawingStore;
