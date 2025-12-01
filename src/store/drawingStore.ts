import { create } from "zustand";
import { validateFileBasic, generateAesKey, encryptFileToBlob, decryptBlobToFile } from "../utils/crypto";

type DrawingState = {
  file: File | null;
  objectUrl: string | null; // points to encrypted blob by default
  encryptionKey: CryptoKey | null;
  encryptionIv: string | null;
  setFile: (f: File | null) => Promise<void>;
  getDecryptedObjectUrl: () => Promise<string | null>;
  clear: () => void;
  selectedDrawingId: string;
  setSelectedDrawingId: (id: string) => void;
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  file: null,
  objectUrl: null,
  encryptionKey: null,
  encryptionIv: null,
  selectedDrawingId: localStorage.getItem("fm_selectedDrawingId") || "",
  setFile: async (f) => {
    // libera l'URL precedente
    const prevUrl = get().objectUrl;
    if (prevUrl) try { URL.revokeObjectURL(prevUrl); } catch (_) {}

    if (!f) {
      // se null -> svuota tutto
      set({ file: null, objectUrl: null, encryptionKey: null, encryptionIv: null });
      localStorage.removeItem("fm_drawing_name");
      return;
    }

    // VALIDAZIONE BASE (estensione, dimensione, mimetype best-effort)
    try {
      const v = validateFileBasic(f);
      if (!v.ok) {
        const msg = v.reason === 'extension' ? 'Formato non supportato' : 'File troppo grande';
        alert(`Upload non valido: ${msg}`);
        return;
      }
    } catch (e) {
      // ignore validation failure
    }

    // prova a generare una chiave AES-GCM (browser). Se non disponibile, fallback a memorizzare file in chiaro
    let key: CryptoKey | null = null;
    try {
      key = await generateAesKey();
    } catch (_) { key = null; }

    try {
      const { blob, iv } = await encryptFileToBlob(f, key);
      const url = URL.createObjectURL(blob);
      set({ file: f, objectUrl: url, encryptionKey: key, encryptionIv: iv ?? null });
      localStorage.setItem("fm_drawing_name", f.name);
    } catch (e) {
      // fallback: create direct objectURL
      const url = URL.createObjectURL(f);
      set({ file: f, objectUrl: url, encryptionKey: null, encryptionIv: null });
      localStorage.setItem("fm_drawing_name", f.name);
    }
  },
  // Restituisce un objectURL temporaneo con il file decriptato (se cifrato)
  getDecryptedObjectUrl: async () => {
    const state = get();
    if (!state.objectUrl) return null;
    try {
      // fetch the blob from the stored objectUrl
      const resp = await fetch(state.objectUrl);
      const encBlob = await resp.blob();
      const file = await decryptBlobToFile(encBlob, state.encryptionKey, state.encryptionIv, (state.file as any)?.name || 'drawing', (state.file as any)?.type || 'application/octet-stream');
      const decUrl = URL.createObjectURL(file);
      // We don't replace stored objectUrl: consumer should revoke decUrl when done
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
}));