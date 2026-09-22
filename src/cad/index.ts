import { loadStlAndAnalyze } from "./loaders/stlLoader";
import { loadGlbAndAnalyze } from "./loaders/glbLoader";
import { loadStepWithOcctAndAnalyze } from "./loaders/stepLoader";
import type { CadAnalysisResult, CadFormat } from "./types";

/**
 * Carica un file CAD (Blob/File) e restituisce:
 * - viewerUrl per il Viewer 3D
 * - volume, area, bbox, spessore medio (dove calcolabile)
 *
 * ATTENZIONE:
 *  - STEP/IGES NON sono implementati qui (servono librerie CAD dedicate,
 *    tipo OpenCascade/WASM o servizio esterno).
 */
export async function loadCadModel(file: File): Promise<CadAnalysisResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, CadFormat> = {
    stl: "stl",
    glb: "glb",
    gltf: "gltf",
    obj: "obj",
    step: "step",
    stp: "step",
    igs: "iges",
    iges: "iges",
  };

  const format = map[ext];
  if (!format) {
    throw new Error(`Formato non supportato: .${ext}`);
  }

  if (format === "stl") {
    try {
      const res = await loadStlAndAnalyze(file);
      console.debug("CAD LOAD RESULT", res);
      return res;
    } catch (e) {
      // Neutralized loader or runtime error — provide minimal fallback
      const url = URL.createObjectURL(file);
      const res = {
        format: "stl",
        volumeCm3: null,
        areaApproxCm2: null,
        thicknessAvgMm: null,
        bbox: { x: 0, y: 0, z: 0 },
        viewerUrl: url,
      } as any;
      console.debug("CAD LOAD RESULT (fallback stl)", res);
      return res;
    }
  }

  if (format === "glb" || format === "gltf") {
    try {
      const res = await loadGlbAndAnalyze(file);
      console.debug("CAD LOAD RESULT", res);
      return res;
    } catch (e) {
      const url = URL.createObjectURL(file);
      const res = {
        format: "glb",
        volumeCm3: null,
        areaApproxCm2: null,
        thicknessAvgMm: null,
        bbox: { x: 0, y: 0, z: 0 },
        viewerUrl: url,
      } as any;
      console.debug("CAD LOAD RESULT (fallback glb)", res);
      return res;
    }
  }

  // Per STEP/IGES/OBJ proviamo a usare un loader dedicato che sfrutti
  // `occt-import-js`. Se non disponibile, il loader effettuerà il
  // fallback a un risultato minimo (viewerUrl) come prima.
  if (format === "step" || format === "iges") {
    // Ora usiamo il loader OCCT + GLB
    try {
      const res = await loadStepWithOcctAndAnalyze(file, format);
      console.debug("CAD LOAD RESULT", res);
      return res;
    } catch (e) {
      const url = URL.createObjectURL(file);
      const res = {
        format: format,
        volumeCm3: null,
        areaApproxCm2: null,
        thicknessAvgMm: null,
        bbox: { x: 0, y: 0, z: 0 },
        viewerUrl: url,
      } as any;
      console.debug("CAD LOAD RESULT (fallback step)", res);
      return res;
    }
  }

  // OBJ (per ora ancora senza analisi)
  if (format === "obj") {
    const url = URL.createObjectURL(file);
    const res = {
      format: "obj",
      volumeCm3: null,
      areaApproxCm2: null,
      thicknessAvgMm: null,
      bbox: { x: 0, y: 0, z: 0 },
      viewerUrl: url,
    } as any;
    console.debug("CAD LOAD RESULT (obj)", res);
    return res;
  }

  throw new Error(`Formato non gestito internamente: ${format}`);
}
