import { create } from 'zustand';

export type CadStatus = 'idle' | 'loading' | 'ready' | 'error';

type CadState = {
  file: File | null;
  fileName: string | null;
  status: CadStatus;
  viewerUrl: string | null;
  volumeCm3: number | null;
  areaProjCm2: number | null;
  thicknessAvgMm: number | null;
  error: string | null;

  startLoading: (file: File) => void;
  setResult: (opts: { viewerUrl?: string | null; volumeCm3?: number | null; areaProjCm2?: number | null; thicknessAvgMm?: number | null }) => void;
  setError: (err: string) => void;
  reset: () => void;
};

export const useCadStore = create<CadState>((set, get) => ({
  file: null,
  fileName: null,
  status: 'idle',
  viewerUrl: null,
  volumeCm3: null,
  areaProjCm2: null,
  thicknessAvgMm: null,
  error: null,

  startLoading: (file: File) => {
    try {
      const prev = get().viewerUrl;
      if (prev) {
        try { URL.revokeObjectURL(prev); } catch (_) {}
      }
    } catch (_) {}
    set({ file, fileName: file.name, status: 'loading', viewerUrl: null, volumeCm3: null, areaProjCm2: null, thicknessAvgMm: null, error: null });
  },

  setResult: ({ viewerUrl = null, volumeCm3 = null, areaProjCm2 = null, thicknessAvgMm = null }) => {
    try {
      const prev = get().viewerUrl;
      if (prev && prev !== viewerUrl) {
        try { URL.revokeObjectURL(prev); } catch (_) {}
      }
    } catch (_) {}
    set({ viewerUrl: viewerUrl ?? null, volumeCm3: volumeCm3 ?? null, areaProjCm2: areaProjCm2 ?? null, thicknessAvgMm: thicknessAvgMm ?? null, status: 'ready', error: null });
  },

  setError: (err: string) => set({ status: 'error', error: err }),

  reset: () => {
    try {
      const prev = get().viewerUrl;
      if (prev) {
        try { URL.revokeObjectURL(prev); } catch (_) {}
      }
    } catch (_) {}
    set({ file: null, fileName: null, status: 'idle', viewerUrl: null, volumeCm3: null, areaProjCm2: null, thicknessAvgMm: null, error: null });
  }
}));

export default useCadStore;
