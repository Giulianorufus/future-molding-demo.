import { analyzeCADFile } from '@/lib/cadAnalysis';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { useCadStore } from '@/store/cadStore';

export async function startCadPipeline(file: File) {
  const store = useCadStore.getState();
  try {
    useCadStore.getState().startLoading(file);
  } catch (e) {
    // if store not ready, ignore
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

    useCadStore.getState().setResult({
      viewerUrl,
      volumeCm3: (result as any).volume ?? null,
      areaProjCm2: (result as any).projectedArea_cm2 ?? (result as any).surface_area ?? null,
      thicknessAvgMm: thicknessAvg ?? null,
    });

    return { success: true, result };
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? 'Unknown analysis error');
    try { useCadStore.getState().setError(msg); } catch (_) {}
    return { success: false, error: msg };
  }
}

export default startCadPipeline;
