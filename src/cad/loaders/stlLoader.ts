import * as THREE from "three";

// Nota: evitare import statico di `three/examples/jsm/*` perché in ambiente
// di test (Node/Jest) quei file sono ESM e provocano errori di parsing.
// In ambiente browser carichiamo il loader in modo lazy.
let _STLLoader: any = null;
function getSTLLoader() {
  if (_STLLoader) return _STLLoader;
  if (typeof window === "undefined") {
    // running in Node (tests): non carichiamo il loader delle examples
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("three/examples/jsm/loaders/STLLoader");
  _STLLoader = mod?.STLLoader ?? mod?.default ?? null;
  return _STLLoader;
}
import type { CadAnalysisResult } from "../types";
import { computeMeshVolume } from "../analyzers/meshVolume";

// loader sarà creato al volo nella funzione se disponibile

/**
 * Carica un file STL dal browser (File/Blob),
 * crea un ObjectURL per il viewer e calcola:
 * - volume approssimato
 * - area approssimata (da bbox)
 * - bbox
 * - spessore medio = null (serve logica ulteriore)
 */
export async function loadStlAndAnalyze(file: File): Promise<CadAnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const Loader = getSTLLoader();
  if (!Loader) throw new Error('STLLoader not available in this environment');
  const loader = new Loader();
  const geometry = loader.parse(arrayBuffer as ArrayBuffer);

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const volume = computeMeshVolume(geometry);
  const areaApprox = size.x * size.y; // area proiettata grezza, da migliorare se serve

  const url = URL.createObjectURL(file);

  return {
    format: "stl",
    volumeCm3: volume,
    areaApproxCm2: areaApprox,
    thicknessAvgMm: null,
    bbox: {
      x: size.x,
      y: size.y,
      z: size.z,
    },
    viewerUrl: url,
  };
}
