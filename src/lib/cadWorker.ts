// Web Worker (module) for CAD parsing using occt-import-js
// This file is intended to be used as a Vite module worker: new Worker(new URL('./cadWorker.ts', import.meta.url), { type: 'module' })

import { getOcct } from './occtInit';

async function parseBuffer(dataBuf: ArrayBuffer, fileName: string, ext: string) {
  const data = new Uint8Array(dataBuf);
  const occt = await getOcct();

  if (ext === 'step' || ext === 'stp') {
    const res = await occt.readStepFile(data, fileName || 'model.step');
    return { meshes: res.meshes ?? null };
  }
  if (ext === 'iges' || ext === 'igs') {
    const res = await occt.readIgesFile(data, fileName || 'model.iges');
    return { meshes: res.meshes ?? null };
  }
  if (ext === 'stl') {
    const res = await occt.readStlFile(data, fileName || 'model.stl');
    const meshArr = res.meshes ?? (res.mesh ? [res.mesh] : []);
    return { meshes: meshArr };
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
