/* ================== FILE: src/lib/adapters.ts ================== */
/* Future Molding – Adapters helpers
    Compatibilità con la struttura dati locale. Non cambia gli export esistenti.
*/
export function loadPressData() {
    try {
        const mod = require('../lib/pressData.ts');
        const arr = mod.PRESS_DATA || mod.default || [];
        return Array.isArray(arr) ? arr : [];
    }
    catch {
        return [];
    }
}
const norm = (s) => (s || '').toString().trim().toLowerCase();
export function getBrands() {
    const data = loadPressData();
    const set = new Set();
    for (const p of data)
        if (p?.brand)
            set.add(p.brand);
    return Array.from(set).sort();
}
export function getModelsByBrand(brand) {
    const data = loadPressData();
    const b = norm(brand);
    return data.filter(p => norm(p.brand) === b).map(p => p.model).sort();
}
export function findPress(brand, model) {
    const data = loadPressData();
    return data.find(p => norm(p.brand) === norm(brand) && p.model === model);
}
export function getSavedDrawings() {
    const tryKeys = ['drawings', 'future-molding-drawings', 'fm_drawings', 'files', 'cad_drawings'];
    for (const k of tryKeys) {
        try {
            const raw = localStorage.getItem(k);
            if (!raw)
                continue;
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr))
                continue;
            const list = arr.map((d, i) => ({
                id: d?.id ?? d?.uuid ?? String(i),
                name: d?.name ?? d?.fileName ?? d?.filename ?? (typeof d === 'string' ? d : `Disegno ${i + 1}`),
                createdAt: d?.createdAt ?? Date.now(),
                ...d
            }));
            if (list.length)
                return list;
        }
        catch { /* ignore */ }
    }
    return [];
}
