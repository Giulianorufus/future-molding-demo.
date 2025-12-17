// Web Worker (module) for CAD parsing using occt-import-js
// This file is intended to be used as a Vite module worker: new Worker(new URL('./cadWorker.ts', import.meta.url), { type: 'module' })

import { getOcct } from './occtInit';

async function parseBuffer(dataBuf: ArrayBuffer, fileName: string, ext: string) {
  const data = new Uint8Array(dataBuf);
  const occt = await getOcct();
  // local tolerant helpers similar to cadParser
  function flattenTriplets(arr: any): any {
    if (!arr) return arr;
    if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) return arr.flat();
    return arr;
  }
  function normalizeMeshes(meshes: any[] | undefined | null) {
    if (!meshes || !Array.isArray(meshes)) return [];
    return meshes
      .map((m) => {
        const positions = m.positions ?? m.attributes?.position?.array ?? m.attributes?.position?.data;
        const indices = m.indices ?? m.index?.array ?? m.attributes?.index?.array ?? m.attributes?.index?.data;
        const normals = m.normals ?? m.attributes?.normal?.array ?? m.attributes?.normal?.data;
        const pos = flattenTriplets(positions);
        if (!pos) return null;
        return { positions: pos, indices: flattenTriplets(indices), normals: flattenTriplets(normals) };
      })
      .filter(Boolean);
  }

  function pickOcctFn(occt: any, names: string[]) {
    for (const n of names) {
      const fn = occt?.[n];
      if (typeof fn === 'function') return fn.bind(occt);
    }
    return null;
  }

  async function callOcctReader(fn: any, data: Uint8Array, fileName: string) {
    try { return await Promise.resolve(fn(data, null)); } catch (e) { return await Promise.resolve(fn(data, fileName || null)); }
  }

  if (ext === 'step' || ext === 'stp') {
    try {
      const { readSTEP } = await import('./occt/occtClient');
      const res = await readSTEP(data);
      const meshes = normalizeMeshes(res?.meshes ?? null);
      return { meshes };
    } catch (err) {
      // fallback to direct occt readers
      const fn = pickOcctFn(occt, ['ReadStepFile', 'readStepFile', 'ReadSTEPFile', 'readSTEPFile']);
      if (!fn) throw new Error('OCCT STEP reader not available');
      const res = await callOcctReader(fn, data, fileName || 'model.step');
      const meshes = normalizeMeshes(res?.meshes ?? null);
      return { meshes };
    }
  }
  if (ext === 'iges' || ext === 'igs') {
    const fn = pickOcctFn(occt, ['ReadIgesFile', 'readIgesFile', 'ReadIGESFile', 'readIGESFile']);
    if (!fn) throw new Error('OCCT IGES reader not available');
    const res = await callOcctReader(fn, data, fileName || 'model.iges');
    const meshes = normalizeMeshes(res?.meshes ?? null);
    return { meshes };
  }
  if (ext === 'stl') {
    const fn = pickOcctFn(occt, ['ReadStlFile', 'readStlFile', 'ReadSTLFile', 'readSTLFile']);
    if (!fn) throw new Error('OCCT STL reader not available');
    const res = await callOcctReader(fn, data, fileName || 'model.stl');
    const meshes = normalizeMeshes(res?.meshes ?? (res?.mesh ? [res.mesh] : []));
    return { meshes };
  }
  throw new Error('Formato CAD non supportato dal worker');
}

self.addEventListener('message', async (ev: MessageEvent) => {
  const { id, arrayBuffer, fileName, ext } = ev.data || {};
  try {
    // Start a heartbeat progress so the main thread can show activity for long parses
    let progress = 0;
    const heartbeat = setInterval(() => {
      progress = Math.min(95, progress + Math.floor(Math.random() * 10) + 5);
      try { (self as any).postMessage({ id, progress, status: 'parsing' }); } catch (e) { /* ignore */ }
    }, 700);

    const r = await parseBuffer(arrayBuffer, fileName, ext);
    clearInterval(heartbeat);
    // Final progress
    try { (self as any).postMessage({ id, progress: 100, status: 'done' }); } catch (e) { /* ignore */ }
    // transfer typed arrays back if present
    const transfer: Transferable[] = [];
    if (r.meshes) {
      for (const m of r.meshes) {
        if (m.positions && m.positions.buffer) transfer.push(m.positions.buffer);
        if (m.indices && m.indices.buffer) transfer.push(m.indices.buffer);
        if (m.normals && m.normals.buffer) transfer.push(m.normals.buffer);
      }
    }
    // post success
    (self as any).postMessage({ id, ok: true, result: r }, transfer);
  } catch (err: any) {
    try { (self as any).postMessage({ id, progress: 0, status: 'error' }); } catch (e) {}
    (self as any).postMessage({ id, ok: false, error: String(err?.message ?? err) });
  }
});
