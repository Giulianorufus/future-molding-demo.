import * as THREE from "three";

// Evitiamo import statici delle examples (causano errori in Node/Jest).
let _GLTFLoader: any = null;
function getGLTFLoader() {
  if (_GLTFLoader) return _GLTFLoader;
  if (typeof window === "undefined") return null; // non disponibile nei test
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("three/examples/jsm/loaders/GLTFLoader");
  _GLTFLoader = mod?.GLTFLoader ?? mod?.default ?? null;
  return _GLTFLoader;
}
import type { CadAnalysisResult } from "../types";
import { computeMeshVolume } from "../analyzers/meshVolume";

// loader verrà creato dinamicamente nella funzione load

/**
 * Carica GLB/GLTF.
 * Per semplicità:
 * - prende la prima mesh trovata
 * - calcola bbox
 * - volume approssimato
 */
export async function loadGlbAndAnalyze(file: File): Promise<CadAnalysisResult> {
  const url = URL.createObjectURL(file);
  const Loader = getGLTFLoader();
  if (!Loader) throw new Error('GLTFLoader not available in this environment');
  const loader = new Loader();

  const gltf = await new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      url,
      (res: any) => resolve(res.scene),
      undefined,
      (err: any) => reject(err)
    );
  });

  // Trova la prima mesh
  let mesh: THREE.Mesh | null = null;
  gltf.traverse((obj) => {
    if (!mesh && (obj as THREE.Mesh).isMesh) {
      mesh = obj as THREE.Mesh;
    }
  });

  if (!mesh) {
    throw new Error("Nessuna mesh trovata nel file GLB/GLTF.");
  }

  const geometry = mesh.geometry.clone();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const volume = computeMeshVolume(geometry);
  const areaApprox = size.x * size.y;

  return {
    format: "glb",
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
