// src/cad/loaders/stepLoader.ts
// Hardened STEP/IGES loader: dynamic OCCT + Three.js usage, safe fallback.

import * as THREE from "three";
import { useDrawingStore } from "@/stores/drawingStore";
import type { CadAnalysisResult } from "../types";
import { computeMeshVolume } from "../analyzers/meshVolume";

type OcctModule = {
  ReadStepFile?: (content: Uint8Array, params?: any) => any;
  ReadIgesFile?: (content: Uint8Array, params?: any) => any;
  readStepFile?: (content: Uint8Array, params?: any) => any;
  readIgesFile?: (content: Uint8Array, params?: any) => any;
};

let occtCache: OcctModule | null | undefined;

async function loadOcctModule(): Promise<OcctModule | null> {
  if (occtCache !== undefined) return occtCache;

  try {
    let factory: any;
    if (typeof window === "undefined") {
      // Node / Jest
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("occt-import-js");
      factory = mod.default ?? mod;
    } else {
      const mod = await import("occt-import-js");
      factory = (mod as any).default ?? mod;
    }

    const occt: any = await factory(
      typeof window === "undefined"
        ? undefined
        : {
            // occt-import-js is Emscripten-based. Point its runtime explicitly at
            // the artifacts copied by postinstall into Vite's public directory.
            locateFile: (fileName: string) => `/vendor/occt/${fileName}`,
          }
    );
    if (!occt) {
      occtCache = null;
      return null;
    }

    occtCache = occt as OcctModule;
    return occtCache;
  } catch (err) {
    console.warn("Impossibile caricare occt-import-js:", err);
    occtCache = null;
    return null;
  }
}

// Build a BufferGeometry from an array of OCCT mesh-like objects
function buildGeometryFromOcctMeshes(meshes: any[]): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  for (const m of meshes) {
    let positions: Float32Array | null = null;
    let indices: Uint32Array | Uint16Array | null = null;

    if (m?.attributes?.position) {
      positions = new Float32Array(m.attributes.position.array);
      if (m.index?.array) indices = new Uint32Array(m.index.array);
    } else if (m?.positions) {
      positions = new Float32Array(m.positions);
      if (m.indices) indices = new (m.positions.length > 65535 ? Uint32Array : Uint16Array)(m.indices);
    }

    if (!positions) continue;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    if (indices) geom.setIndex(new THREE.BufferAttribute(indices as any, 1));
    geom.computeVertexNormals();
    geometries.push(geom);
  }

  if (geometries.length === 0) throw new Error("Nessuna mesh valida da OCCT");
  if (geometries.length === 1) return geometries[0];

  // Try to merge geometries via BufferGeometryUtils when available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bufUtils = require("three/examples/jsm/utils/BufferGeometryUtils");
    const BufferGeometryUtils = bufUtils?.BufferGeometryUtils ?? bufUtils?.default ?? bufUtils;
    return BufferGeometryUtils.mergeBufferGeometries(geometries, true);
  } catch (e) {
    return geometries[0];
  }
}

async function exportGeometryToGlbUrl(geometry: THREE.BufferGeometry): Promise<string> {
  const scene = new THREE.Scene();
  const material = new THREE.MeshStandardMaterial({ metalness: 0.0, roughness: 0.85 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Load the ESM exporter in the browser. Using require() here can fail under Vite.
  const expMod: any = await import("three/examples/jsm/exporters/GLTFExporter");
  const GLTFExporter = expMod?.GLTFExporter ?? expMod?.default;
  if (!GLTFExporter) throw new Error("GLTFExporter non disponibile");

  const exporter = new GLTFExporter();
  const arrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result: ArrayBuffer | object) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("GLTFExporter risultato non binario"));
      },
      (err: any) => reject(err),
      { binary: true }
    );
  });

  const blob = new Blob([arrayBuffer], { type: "model/gltf-binary" });
  return URL.createObjectURL(blob);
}

function fallbackResult(_file: File, format: "step" | "iges"): CadAnalysisResult {
  // A raw STEP/IGES blob is not a valid GLB and must never be handed to GLTFLoader.
  return {
    format,
    volumeCm3: null,
    areaApproxCm2: null,
    thicknessAvgMm: null,
    bbox: { x: 0, y: 0, z: 0 },
    viewerUrl: "",
  };
}

function probeReadResult(occt: OcctModule, data: Uint8Array, isIges: boolean): any {
  const tryFns = isIges
    ? [
        "readIgesFile",
        "ReadIgesFile",
        "readIGESFile",
        "ReadIGESFile",
        "readIGES",
        "ReadIGES",
      ]
    : [
        "readStepFile",
        "ReadStepFile",
        "ReadSTEPFile",
        "readSTEPFile",
        "readSTEP",
        "ReadSTEP",
      ];

  for (const name of tryFns) {
    // @ts-ignore
    if (typeof occt?.[name] === "function") return occt[name](data);
  }

  return null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Conversione STEP→GLB superata il timeout (60s)')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
}

export async function loadStepWithOcctAndAnalyze(file: File, conversionId?: string, format?: "step" | "iges"): Promise<CadAnalysisResult> {
  const fmt = format ?? (file.name.split(".").pop()?.toLowerCase() === "iges" || file.name.split(".").pop()?.toLowerCase() === "igs" ? "iges" : "step");
  const drawing = useDrawingStore.getState();

  // Check if this conversion is still current before starting
  if (conversionId && drawing.conversionId !== conversionId) {
    console.debug('Conversion ID mismatch, skipping outdated conversion', { expected: drawing.conversionId, received: conversionId });
    throw new Error('Conversione annullata: nuovo file caricato');
  }

  drawing.setResult({ isLoading: true, conversionStatus: 'converting' });
  
  // Wrap the entire conversion in a 60-second timeout
  try {
    return await withTimeout(performStepConversion(file, fmt, conversionId), 60000);
  } catch (err: any) {
    console.warn("STEP/IGES conversion timeout or error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    
    // Only update if still current
    const currentState = useDrawingStore.getState();
    if (!conversionId || currentState.conversionId === conversionId) {
      drawing.setResult({ 
        viewerUrl: null, 
        glbUrl: null, 
        volumeCm3: null, 
        surfaceCm2: null, 
        previewUrl: null, 
        error: errMsg, 
        isLoading: false, 
        conversionStatus: 'error', 
        conversionMessage: `Errore conversione: ${errMsg}` 
      });
    }
    return fallbackResult(file, fmt);
  }
}

async function performStepConversion(file: File, fmt: "step" | "iges", conversionId?: string): Promise<CadAnalysisResult> {
  const drawing = useDrawingStore.getState();

  // Guard check: ensure we're still the current conversion
  function isStillCurrent(): boolean {
    const current = useDrawingStore.getState();
    return !conversionId || current.conversionId === conversionId;
  }
  try {
    const occt = await loadOcctModule();
    if (!occt) {
      const fb = fallbackResult(file, fmt);
      if (isStillCurrent()) {
        drawing.setResult({
          viewerUrl: null,
          glbUrl: null,
          volumeCm3: null,
          surfaceCm2: null,
          boundingBox: fb.bbox,
          previewUrl: null,
          error: "OCCT non ha prodotto una geometria visualizzabile.",
          isLoading: false,
          conversionStatus: 'error',
          conversionMessage: "Conversione STEP/IGES non riuscita.",
        });
      }
      return fb;
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const result = probeReadResult(occt, uint8, fmt === "iges");
    if (!result) {
      const fb = fallbackResult(file, fmt);
      if (isStillCurrent()) {
        drawing.setResult({
          viewerUrl: null,
          glbUrl: null,
          volumeCm3: null,
          surfaceCm2: null,
          boundingBox: fb.bbox,
          previewUrl: null,
          error: null,
          isLoading: false,
          conversionStatus: 'ready',
          conversionMessage: undefined,
        });
      }
      return fb;
    }

    const meshes: any[] = Array.isArray(result.meshes) && result.meshes.length ? result.meshes : Array.isArray(result) && result.length ? result : [];
    if (!meshes.length) {
      const fb = fallbackResult(file, fmt);
      if (isStillCurrent()) {
        drawing.setResult({
          viewerUrl: null,
          glbUrl: null,
          volumeCm3: null,
          surfaceCm2: null,
          boundingBox: fb.bbox,
          previewUrl: null,
          error: null,
          isLoading: false,
          conversionStatus: 'ready',
          conversionMessage: undefined,
        });
      }
      return fb;
    }

    const geometry = buildGeometryFromOcctMeshes(meshes);
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox ?? new THREE.Box3();
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // compute volume (try imported util, fallback to approx)
    let volume = null as number | null;
    try {
      volume = computeMeshVolume(geometry);
    } catch (_) {
      try {
        const pos = geometry.getAttribute("position");
        const idx = geometry.getIndex();
        if (pos && idx) {
          let v = 0;
          const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
          for (let i = 0; i < idx.count; i += 3) {
            const ia = idx.getX(i), ib = idx.getX(i + 1), ic = idx.getX(i + 2);
            a.set(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
            b.set(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
            c.set(pos.getX(ic), pos.getY(ic), pos.getZ(ic));
            v += a.dot(b.cross(c));
          }
          volume = Math.abs(v / 6) / 1000;
        }
      } catch (e) {
        volume = null;
      }
    }

    // OCCT coordinates are millimetres. XY projection is mm²; convert to cm².
    // This is a bounding-box projection estimate, not an exact silhouette projection.
    const areaApprox = (size.x * size.y) / 100;

    let viewerUrl: string;
    try {
      viewerUrl = await exportGeometryToGlbUrl(geometry);
    } catch (err) {
      const fb = fallbackResult(file, fmt);
      if (isStillCurrent()) {
        drawing.setResult({
          viewerUrl: null,
          glbUrl: null,
          volumeCm3: null,
          surfaceCm2: null,
          boundingBox: fb.bbox,
          previewUrl: null,
          error: null,
          isLoading: false,
        });
      }
      return fb;
    }

    if (!volume || (volume ?? 0) <= 0) {
      throw new Error("Geometria non valida: volume pezzo mancante o nullo.");
    }

    // Physical sanity check: a closed part cannot have a volume larger than its
    // own bounding box. Reject impossible triangulated-volume results instead
    // of feeding them to molding calculations.
    const bboxVolumeCm3 = (size.x * size.y * size.z) / 1000;
    if (!Number.isFinite(bboxVolumeCm3) || bboxVolumeCm3 <= 0 || volume > bboxVolumeCm3 * 1.001) {
      throw new Error(`Volume CAD incoerente: ${volume.toFixed(3)} cm³ supera il bounding box (${bboxVolumeCm3.toFixed(3)} cm³). Dato non utilizzato nei calcoli.`);
    }

    const geo = {
      volumeCm3: volume ?? 0,
      surfaceCm2: areaApprox,
      boundingBox: { x: size.x, y: size.y, z: size.z },
    };

    // Only update store if this conversion is still current
    if (isStillCurrent()) {
      drawing.setResult({
          viewerUrl: viewerUrl,
          glbUrl: viewerUrl,
          volumeCm3: geo.volumeCm3,
          surfaceCm2: geo.surfaceCm2,
          boundingBox: geo.boundingBox,
          previewUrl: null,
        isLoading: false,
        conversionStatus: 'ready',
        conversionMessage: undefined,
      });
    }

    return {
      format: fmt,
      volumeCm3: volume,
      areaApproxCm2: areaApprox,
      thicknessAvgMm: null,
      bbox: { x: size.x, y: size.y, z: size.z },
      viewerUrl,
    };
    } catch (err) {
      console.warn("STEP/IGES loader error, using fallback:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isStillCurrent()) {
        drawing.setResult({ viewerUrl: null, glbUrl: null, volumeCm3: null, surfaceCm2: null, previewUrl: null, error: errMsg, isLoading: false, conversionStatus: 'error', conversionMessage: `Errore conversione: ${errMsg}` });
      }
      return fallbackResult(file, fmt);
    } finally {
      // Do not override conv status here - let previous setResult stand
    }
}




