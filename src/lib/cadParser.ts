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

export async function parseCAD(file: File, onProgress?: (st: { progress?: number; status?: string; message?: string }) => void): Promise<ParsedCADResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (!ext) throw new Error('Formato CAD non riconosciuto');

  // Try worker-based parsing first (better for large files and to avoid blocking main thread)
  if (typeof Worker !== 'undefined') {
    try {
      // Resolve import.meta.url at runtime using a dynamic function so TypeScript
      // (and ts-jest) won't parse a literal `import.meta` expression which
      // causes TS1343 when module settings differ. If unavailable, fall back
      // to a plain worker path (tests run under Node will skip worker usage).
      let importMetaUrl: string | undefined;
      try {
        // evaluate at runtime; kept inside a string to avoid TS parsing
        // eslint-disable-next-line no-new-func
        importMetaUrl = new Function('return import.meta.url')();
      } catch (_) {
        importMetaUrl = undefined;
      }

      const worker = importMetaUrl
        ? new Worker(new URL('./cadWorker.ts', importMetaUrl), { type: 'module' })
        : new Worker('./cadWorker.js', { type: 'module' });
      const id = Math.random().toString(36).slice(2, 9);
      const p = new Promise<any>((resolve, reject) => {
        const onmsg = (ev: MessageEvent) => {
          const msg = ev.data || {};
          if (msg.id !== id) return;
          // progress update
          if (typeof msg.progress === 'number' || msg.status) {
            try {
              if (onProgress) {
                try { onProgress({ progress: msg.progress, status: msg.status }); } catch (e) {}
              }
            } catch (_) {}
          }
          // final result
          if (msg.ok !== undefined) {
            worker.removeEventListener('message', onmsg);
            worker.terminate();
            if (msg.ok) resolve(msg.result);
            else reject(new Error(msg.error || 'Unknown worker error'));
          }
        };
        worker.addEventListener('message', onmsg);
        worker.postMessage({ id, arrayBuffer, fileName: file.name, ext }, [arrayBuffer]);
      });
      const out = await p;
      const meshes = out.meshes ?? null;
      const g = computeFromMeshes(meshes ?? undefined);
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes: meshes ?? null } as ParsedCADResult;
    } catch (e) {
      // fallback to main-thread parse with clearer message
      console.warn('Worker parsing failed, falling back to main thread:', e);
      try {
        if (onProgress) {
          try { onProgress({ progress: 0, status: 'fallback' }); } catch (err) {}
        }
      } catch (_) {}
    }
  }

  // Main-thread parsing fallback
  try {
    const occtInit = await import('./occtInit');
    const occt = await occtInit.getOcct();
    const data = new Uint8Array(arrayBuffer);
    if (ext === 'step' || ext === 'stp') {
      const res = await occt.readStepFile(data, file.name || 'model.step');
      const g = computeFromMeshes(res.meshes);
      // schedule unload after inactivity to free wasm memory if supported
      try { occtInit.scheduleUnloadOcct(); } catch (e) {}
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes: res.meshes ?? null } as ParsedCADResult;
    } else if (ext === 'iges' || ext === 'igs') {
      const res = await occt.readIgesFile(data, file.name || 'model.iges');
      const g = computeFromMeshes(res.meshes);
      try { occtInit.scheduleUnloadOcct(); } catch (e) {}
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes: res.meshes ?? null } as ParsedCADResult;
    } else if (ext === 'stl') {
      const res = await occt.readStlFile(data, file.name || 'model.stl');
      const meshArr = res.meshes ?? (res.mesh ? [res.mesh] : []);
      const g = computeFromMeshes(meshArr);
      try { occtInit.scheduleUnloadOcct(); } catch (e) {}
      return { volume_cm3: g.volume_cm3, area_cm2: g.area_cm2, thickness_mm: null, features: [], meshes: meshArr } as ParsedCADResult;
    }
  } catch (e: any) {
    throw new Error(`occt-import-js parsing failed: ${e?.message ?? e}`);
  }

  throw new Error('Formato CAD non supportato');
}
