import { analyzeCADFile } from '@/lib/cadAnalysis';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { useDrawingStore } from '@/stores/drawingStore';
import { loadStepWithOcctAndAnalyze } from '@/cad/loaders/stepLoader';

function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

function generateConversionId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function startCadPipeline(file: File) {
  const drawing = useDrawingStore.getState();
  try {
    drawing.setResult({ isLoading: true });
  } catch (e) {
    // ignore
  }

  const safeName = sanitizeFileName(file.name || 'upload');
  const ext = getFileExtension(file.name);
  const isStepOrIges = ['.step', '.stp', '.iges', '.igs'].includes(ext);

  try {
    // For STEP/IGES files: start conversion in background, show placeholder
    if (isStepOrIges) {
      // Generate unique conversion ID for race condition protection
      const conversionId = generateConversionId();
      
      // Set conversion status immediately (no await)
      useDrawingStore.getState().setResult({
        viewerUrl: null,
        previewUrl: null,
        glbUrl: null,
        volumeCm3: null,
        surfaceCm2: null,
        boundingBox: null,
        isLoading: false,
        error: null,
        conversionStatus: 'converting',
        conversionMessage: 'Modello STEP caricato. Conversione GLB non ancora disponibile.',
        conversionId,
      });

      // Kick off conversion in background (no await to avoid UI block)
      loadStepWithOcctAndAnalyze(file, conversionId).catch((err) => {
        console.warn('STEP/IGES conversion failed:', err);
        // Only update error if this conversion is still current
        const currentState = useDrawingStore.getState();
        if (currentState.conversionId === conversionId) {
          useDrawingStore.getState().setResult({
            conversionStatus: 'error',
            conversionMessage: `Conversione fallita: ${err?.message ?? String(err)}`,
            isLoading: false,
          });
        }
      });

      console.debug('CAD LOAD (STEP/IGES)', { file: file.name, status: 'converting', conversionId });
      return { success: true, result: null, viewerUrl: null, isConverting: true };
    }

    // For other formats (GLB, STL): use standard analysis
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

    // Create a preview URL for the uploaded file as fallback viewerUrl (only for non-STEP files)
    let viewerUrl: string | null = null;
    try {
      viewerUrl = URL.createObjectURL(file);
    } catch (_) {
      viewerUrl = null;
    }

    useDrawingStore.getState().setResult({
      viewerUrl: viewerUrl,
      previewUrl: null,
      glbUrl: null,
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
      conversionStatus: 'ready',
      conversionMessage: undefined,
    });

    console.debug('CAD LOAD RESULT', { file: file.name, viewerUrl, volumeCm3: (result as any).volume ?? null, surfaceCm2: (result as any).projectedArea_cm2 ?? (result as any).surface_area ?? null });
    console.debug('STORE AFTER CAD', useDrawingStore.getState());

    return { success: true, result, viewerUrl };
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? 'Unknown analysis error');
    try { useDrawingStore.getState().setResult({ error: msg, isLoading: false, conversionStatus: 'error' }); } catch (_) {}
    return { success: false, error: msg };
  }
}

export default startCadPipeline;
