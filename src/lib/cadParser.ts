// Parser CAD avanzato con occt-import-js
// Use dynamic import + initializer so we can control where the .wasm/worker are fetched from (Vite dev server)

export interface GeometryData {
  volume_cm3: number;
  area_cm2: number;
  thickness_mm?: number | null;
  features?: string[];
}

export interface ParsedCADResult extends GeometryData {
  meshes?: Array<{ positions: Float32Array | number[]; indices?: Uint32Array | number[]; normals?: Float32Array | number[] }>;
}

function computeFromMeshes(meshes: any[] | undefined) {
  let vol_mm3 = 0;
  let area_mm2 = 0;
  if (!meshes) return { volume_cm3: 0, area_cm2: 0 };
  for (const m of meshes) {
    const p = m.positions as Float32Array | number[];
    const idx = (m.indices as (Uint32Array | number[] | undefined));
    if (!p) continue;
    // build index if missing
    let indices: number[];
    if (idx && (idx as any).length) {
      indices = Array.from(idx as any);
    } else {
      indices = [];
      for (let i = 0; i < p.length / 3; i++) indices.push(i);
    }
    // accumulate
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3, i1 = indices[i + 1] * 3, i2 = indices[i + 2] * 3;
      const ax = p[i0], ay = p[i0 + 1], az = p[i0 + 2];
      const bx = p[i1], by = p[i1 + 1], bz = p[i1 + 2];
      const cx = p[i2], cy = p[i2 + 1], cz = p[i2 + 2];
      // cross product b x c
      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      const triVol = ax * (by * cz - bz * cy) + bx * (cy * az - cz * ay) + cx * (ay * bz - az * by);
      vol_mm3 += triVol;
      const area = 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);
      area_mm2 += area;
    }
  }
  vol_mm3 = Math.abs(vol_mm3) / 6;
  return { volume_cm3: vol_mm3 / 1000, area_cm2: area_mm2 / 100 };
}

// --- API-stability helpers & normalization ---
type AnyMesh = any;

function flattenTriplets(arr: any): any {
  if (!arr) return arr;
  if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) {
    return arr.flat();
  }
  return arr;
}

function normalizeMeshes(meshes: AnyMesh[] | undefined | null): ParsedCADResult["meshes"] {
  if (!meshes || !Array.isArray(meshes)) return [];

  return meshes
    .map((m) => {
      const positions =
        m.positions ??
        m.attributes?.position?.array ??
        m.attributes?.position?.Array ??
        m.attributes?.position?.data;

      const indices =
        m.indices ??
        m.index?.array ??
        m.attributes?.index?.array ??
        m.attributes?.index?.data;

      const normals =
        m.normals ??
        m.attributes?.normal?.array ??
        m.attributes?.normal?.data;

      const posFlat = flattenTriplets(positions);
      const idxFlat = flattenTriplets(indices);
      const nrmFlat = flattenTriplets(normals);

      if (!posFlat) return null;

      return {
        positions: posFlat,
        indices: idxFlat,
        normals: nrmFlat,
      };
    })
    .filter(Boolean) as any;
}

function pickOcctFn(occt: any, names: string[]): ((data: Uint8Array, arg2: any) => any) | null {
  for (const n of names) {
    const fn = occt?.[n];
    if (typeof fn === "function") return fn.bind(occt);
  }
  return null;
}

async function callOcctReader(fn: (data: Uint8Array, arg2: any) => any, data: Uint8Array, fileName: string) {
  try {
    return await Promise.resolve(fn(data, null));
  } catch (e1) {
    return await Promise.resolve(fn(data, fileName || null));
  }
}

function failSoftResult(ext: string, message: string): ParsedCADResult {
  console.warn(message);
  return {
    volume_cm3: 0,
    area_cm2: 0,
    thickness_mm: null,
    features: ["occt-unavailable", `ext:${ext}`],
    meshes: [],
  };
}

// Worker gating and helpers (module scope so we can export disposeCadWorker)
const CAD_ENABLED = process.env.RUN_CAD_INTEGRATION === '1' && process.env.NODE_ENV !== 'test';
let _cadWorker: any = null;

function getWorker(): any | null {
  if (!CAD_ENABLED) return null;
  if (_cadWorker) return _cadWorker;

  let importMetaUrl: string | undefined;
  try {
    // evaluate at runtime; kept inside a string to avoid TS parsing
    // eslint-disable-next-line no-new-func
    importMetaUrl = new Function('return import.meta.url')();
  } catch (_) {
    importMetaUrl = undefined;
  }

  _cadWorker = importMetaUrl
    ? new Worker(new URL('./cadWorker.ts', importMetaUrl), { type: 'module' })
    : new Worker('./cadWorker.js', { type: 'module' });

  return _cadWorker;
}

export function disposeCadWorker() {
  if (_cadWorker) {
    try { _cadWorker.terminate(); } catch (_) {}
    _cadWorker = null;
  }
}

export async function parseCAD(file: File, onProgress?: (st: { progress?: number; status?: string; message?: string }) => void): Promise<ParsedCADResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (!ext) throw new Error('Formato CAD non riconosciuto');

  // Try worker-based parsing first (better for large files and to avoid blocking main thread)
  if (typeof Worker !== 'undefined') {
    const w = getWorker();
    if (w) {
      try {
        const id = Math.random().toString(36).slice(2, 9);
        const p = new Promise<any>((resolve, reject) => {
          const onmsg = (ev: MessageEvent) => {
            const msg = ev.data || {};
            if (msg.id !== id) return;
            if (typeof msg.progress === 'number' || msg.status) {
              try { if (onProgress) { try { onProgress({ progress: msg.progress, status: msg.status }); } catch (e) {} } } catch (_) {}
            }
            if (msg.ok !== undefined) {
              try { w.removeEventListener('message', onmsg); } catch (_) {}
              if (msg.ok) resolve(msg.result);
              else reject(new Error(msg.error || 'Unknown worker error'));
            }
          };
          try { w.addEventListener('message', onmsg); } catch (_) {}
          try { w.postMessage({ id, arrayBuffer, fileName: file.name, ext }, [arrayBuffer]); } catch (err) { reject(err); }
        });
        const out = await p;
        const meshes = normalizeMeshes(out.meshes ?? null);
        const g = computeFromMeshes(meshes ?? undefined);
        return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes } as ParsedCADResult;
      } catch (e) {
        // fallback to main-thread parse with clearer message
        console.warn('Worker parsing failed, falling back to main thread:', e);
        try { if (onProgress) { try { onProgress({ progress: 0, status: 'fallback' }); } catch (err) {} } } catch (_) {}
      }
    }
  }

  // Main-thread parsing fallback (API-stable, multi-name readers, fail-soft)
  try {
    const occtInit = await import("./occtInit");
    const occt = await occtInit.getOcct();
    const data = new Uint8Array(arrayBuffer);

    if (ext === "step" || ext === "stp") {
        // keep occtInit around for unload scheduling; use occt-client for step read
        try {
          const { readSTEP } = await import('@/lib/occt/occtClient');
          const res = await readSTEP(data);
          const meshes = normalizeMeshes(res?.meshes);
          const g = computeFromMeshes(meshes ?? undefined);
          try { occtInit.scheduleUnloadOcct(); } catch (_) {}
          return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes } as ParsedCADResult;
        } catch (err: any) {
          return failSoftResult(ext, `OCCT STEP import failed: ${String(err?.message ?? err)}`);
        }
    }

    if (ext === "iges" || ext === "igs") {
      const fn = pickOcctFn(occt, ["ReadIgesFile", "readIgesFile", "ReadIGESFile", "readIGESFile"]);
      if (!fn) return failSoftResult(ext, "OCCT API mismatch: no IGES reader found on occt instance.");

      const res = await callOcctReader(fn, data, file.name || "model.iges");
      if (res?.success === false) return failSoftResult(ext, "OCCT IGES import failed (success=false).");

      const meshes = normalizeMeshes(res?.meshes);
      const g = computeFromMeshes(meshes as any);

      try { occtInit.scheduleUnloadOcct(); } catch (_) {}
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes } as ParsedCADResult;
    }

    if (ext === "stl") {
      const fn = pickOcctFn(occt, ["ReadStlFile", "readStlFile", "ReadSTLFile", "readSTLFile"]);
      if (!fn) return failSoftResult(ext, "OCCT API mismatch: no STL reader found on occt instance.");

      const res = await callOcctReader(fn, data, file.name || "model.stl");
      if (res?.success === false) return failSoftResult(ext, "OCCT STL import failed (success=false).");

      const meshes = normalizeMeshes(res?.meshes ?? (res?.mesh ? [res.mesh] : []));
      const g = computeFromMeshes(meshes as any);

      try { occtInit.scheduleUnloadOcct(); } catch (_) {}
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes } as ParsedCADResult;
    }
  } catch (e: any) {
    return failSoftResult(ext ?? "unknown", `occt-import-js parsing failed: ${e?.message ?? e}`);
  }

  throw new Error('Formato CAD non supportato');
}
