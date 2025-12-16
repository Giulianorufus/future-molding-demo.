import { analyzeCADFile } from '@/lib/cadAnalysis';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { useDrawingStore } from '@/stores/drawingStore';

export async function startCadPipeline(file: File) {
  const drawing = useDrawingStore.getState();
  try {
    drawing.setResult({ isLoading: true });
  } catch (e) {
    // ignore
  }

  const safeName = sanitizeFileName(file.name || 'upload');

  try {
    // Try the comprehensive analysis (may use OCCT/WASM or built-in parser)
    const result = await analyzeCADFile(file, (st) => {
      // Optional progress can be used later to update UI
    });

    // compute thickness average if available
    let thicknessAvg: number | null = null;
    try {
      if ((result as any).thickness_map && Array.isArray((result as any).thickness_map) && (result as any).thickness_map.length) {
        const arr = (result as any).thickness_map as number[];
        thicknessAvg = arr.reduce((a, b) => a + b, 0) / arr.length;
      } else if (result.thickness_min !== undefined && result.thickness_max !== undefined) {
        thicknessAvg = (result.thickness_min + result.thickness_max) / 2;
      }
    } catch (_) {
      thicknessAvg = null;
    }

    // Create a preview URL for the uploaded file as fallback viewerUrl
    let viewerUrl: string | null = null;
    try {
      viewerUrl = URL.createObjectURL(file);
    } catch (_) {
      viewerUrl = null;
    }

    useDrawingStore.getState().setResult({
      previewUrl: viewerUrl,
      volumeCm3: (result as any).volume ?? null,
      surfaceCm2: (result as any).projectedArea_cm2 ?? (result as any).surface_area ?? null,
      boundingBox: (result as any).bbox ?? null,
      mesh: (result as any).meshes && (result as any).meshes.length > 0
        ? (function () {
            const m = (result as any).meshes[0];
            const positions = m.positions instanceof Float32Array ? m.positions : (Array.isArray(m.positions) ? Float32Array.from(m.positions) : undefined);
            const indices = m.indices ? (m.indices instanceof Uint32Array ? m.indices : Uint32Array.from(m.indices)) : undefined;
            const bbox = (result as any).bbox ?? null
            return { positions, indices, bbox_mm: bbox }
          })()
        : null,
      isLoading: false,
      error: null,
    });

    return { success: true, result };
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? 'Unknown analysis error');
    try { useDrawingStore.getState().setResult({ error: msg, isLoading: false }); } catch (_) {}
    return { success: false, error: msg };
  }
}

export default startCadPipeline;
