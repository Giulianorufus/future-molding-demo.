// Servizio di persistenza locale (localStorage)

export type Settings = {
  azienda: string;
  reparto: string;
};

export type DrawingMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  // optional operator-provided fallbacks
  manualVolume_cm3?: number;
  manualThickness_mm?: number;
};

const KEY_SETTINGS = "app:settings";
const KEY_DRAWINGS = "app:drawings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { azienda: "", reparto: "" };
    const parsed = JSON.parse(raw);
    return { azienda: parsed.azienda ?? "", reparto: parsed.reparto ?? "" };
  } catch {
    return { azienda: "", reparto: "" };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

export function loadDrawings(): DrawingMeta[] {
  try {
    const raw = localStorage.getItem(KEY_DRAWINGS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list as DrawingMeta[];
  } catch {
    return [];
  }
}

function persistDrawings(list: DrawingMeta[]) {
  localStorage.setItem(KEY_DRAWINGS, JSON.stringify(list));
}

export function addDrawing(file: { name: string; size: number; type: string }): DrawingMeta {
  const entry: DrawingMeta = {
    id: Math.random().toString(36).slice(2, 10),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: Date.now(),
  };
  const list = loadDrawings();
  list.unshift(entry);
  persistDrawings(list);
  return entry;
}

export function removeDrawing(id: string) {
  const list = loadDrawings().filter((d) => d.id !== id);
  persistDrawings(list);
}

export function updateDrawingMeta(id: string, patch: Partial<DrawingMeta>) {
  const list = loadDrawings();
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...patch };
  persistDrawings(list);
  return true;
}

// Analysis persistence helpers (store analysis JSON and thumbnail in IndexedDB via services/db)
import * as db from './db';

export async function saveDrawingAnalysis(drawingId: string, analysis: any) {
  try {
    const blob = new Blob([JSON.stringify(analysis)], { type: 'application/json' });
    await db.saveDrawingFile(`analysis:${drawingId}`, blob as any);
    return true;
  } catch (e) {
    console.error('saveDrawingAnalysis error', e);
    return false;
  }
}

export async function getDrawingAnalysis(drawingId: string): Promise<any | null> {
  try {
    const val = await db.getDrawingBlob(`analysis:${drawingId}`);
    if (!val) return null;
    const text = await val.blob.text();
    return JSON.parse(text);
  } catch (e) {
    console.error('getDrawingAnalysis error', e);
    return null;
  }
}

export async function saveDrawingThumbnail(drawingId: string, dataUrl: string) {
  try {
    // convert dataURL to blob
    const parts = dataUrl.split(',');
    const meta = parts[0].match(/data:(.*);base64/);
    const b64 = parts[1];
    const contentType = meta ? meta[1] : 'image/png';
    const byteChars = atob(b64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    await db.saveDrawingFile(`thumb:${drawingId}`, blob as any);
    return true;
  } catch (e) {
    console.error('saveDrawingThumbnail error', e);
    return false;
  }
}

export async function getDrawingThumbnail(drawingId: string): Promise<string | null> {
  try {
    const val = await db.getDrawingBlob(`thumb:${drawingId}`);
    if (!val) return null;
    const url = URL.createObjectURL(val.blob);
    return url;
  } catch (e) {
    console.error('getDrawingThumbnail error', e);
    return null;
  }
}

// High-level helper to store file + analysis + thumbnail; returns drawing meta id
export async function storeAnalysisResult(file: File, analysis: any, thumbnailDataUrl?: string) {
  const entry = addDrawing({ name: file.name, size: file.size, type: file.type });
  try {
    await db.saveDrawingFile(entry.id, file as any);
  } catch (e) {
    console.warn('storeAnalysisResult: saving file failed', e);
  }
  try {
    await saveDrawingAnalysis(entry.id, analysis);
  } catch (e) {
    console.warn('storeAnalysisResult: saving analysis failed', e);
  }
  if (thumbnailDataUrl) {
    try {
      await saveDrawingThumbnail(entry.id, thumbnailDataUrl);
    } catch (e) {
      console.warn('storeAnalysisResult: saving thumbnail failed', e);
    }
  }
  return entry;
}

// Export all drawings + analysis + thumbnails into a single JSON backup (base64-encoded blobs)
export async function exportBackup(): Promise<Blob> {
  const drawings = loadDrawings();
  const payload: any[] = [];
  for (const d of drawings) {
    const row: any = { meta: d };
    try {
      const f = await db.getDrawingBlob(d.id);
      if (f && f.blob) {
        const arr = new Uint8Array(await f.blob.arrayBuffer());
        row.file = { type: f.type, data: Array.from(arr) };
      }
    } catch (e) {}
    try {
      const a = await getDrawingAnalysis(d.id);
      if (a) row.analysis = a;
    } catch (e) {}
    try {
      const t = await getDrawingThumbnail(d.id);
      if (t) row.thumbnail = t;
    } catch (e) {}
    payload.push(row);
  }
  const blob = new Blob([JSON.stringify({ exportedAt: Date.now(), drawings: payload })], { type: 'application/json' });
  return blob;
}

// Import backup JSON previously created with exportBackup
export async function importBackup(blob: Blob): Promise<{ imported: number }> {
  const text = await blob.text();
  const doc = JSON.parse(text) as any;
  const items = doc?.drawings ?? [];
  let count = 0;
  for (const it of items) {
      const meta = it.meta as DrawingMeta;
      if (!meta) continue;
      // add drawing meta
      const entry = addDrawing({ name: meta.name, size: meta.size, type: meta.type });
      // restore file
      if (it.file && it.file.data) {
        const arr = Uint8Array.from(it.file.data as number[]);
        const blobFile = new Blob([arr], { type: it.file.type || 'application/octet-stream' });
        try { await db.saveDrawingFile(entry.id, blobFile as any); } catch (e) {}
      }
      // restore analysis
      if (it.analysis) {
        try { await saveDrawingAnalysis(entry.id, it.analysis); } catch (e) {}
      }
      // restore thumbnail (if full data URL stored)
      if (it.thumbnail) {
        try { await saveDrawingThumbnail(entry.id, it.thumbnail); } catch (e) {}
      }
      count++;
  }
  return { imported: count };
}

