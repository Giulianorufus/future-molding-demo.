/* ================== FILE: src/lib/adapters.ts ================== */
/* Future Molding – Adapters helpers
  Compatibilità con la struttura dati locale. Non cambia gli export esistenti.
*/

export type PressItem = {
  brand: string;
  model: string;
  specs: Record<string, any>;
};

export function loadPressData(): PressItem[] {
  try {
    const mod = require('../lib/pressData.ts');
    const arr = mod.PRESS_DATA || mod.default || [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const norm = (s: string) => (s || '').toString().trim().toLowerCase();

export function getBrands(): string[] {
  const data = loadPressData();
  const set = new Set<string>();
  for (const p of data) if (p?.brand) set.add(p.brand);
  return Array.from(set).sort();
}

export function getModelsByBrand(brand: string): string[] {
  const data = loadPressData();
  const b = norm(brand);
  return data.filter(p => norm(p.brand) === b).map(p => p.model).sort();
}

export function findPress(brand: string, model: string): PressItem | undefined {
  const data = loadPressData();
  return data.find(p => norm(p.brand) === norm(brand) && p.model === model);
}

export type SavedDrawing = { id: string; name: string; createdAt?: number; [k: string]: any };

export function getSavedDrawings(): SavedDrawing[] {
  const tryKeys = ['drawings', 'future-molding-drawings', 'fm_drawings', 'files', 'cad_drawings'];
  for (const k of tryKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) continue;
      const list = arr.map((d: any, i: number) => ({
        id: d?.id ?? d?.uuid ?? String(i),
        name: d?.name ?? d?.fileName ?? d?.filename ?? (typeof d === 'string' ? d : `Disegno ${i + 1}`),
        createdAt: d?.createdAt ?? Date.now(),
        ...d
      }));
      if (list.length) return list;
    } catch {/* ignore */}
  }
  return [];
}