// Adapter to canonical materialCatalog
const { getMaterialInput, default: materialCatalog } = require('../data/materialCatalog');
export function getMaterialByCode(code) {
    if (!code) return null;
    const m = getMaterialInput(code);
    if (!m) return null;
    return {
        code: m.id,
        name: m.nome,
        MVR: { value: 0, tempC: 0, loadKg: 0, unit: 'cm3/10min' },
        tipo: 'amorf',
        density_g_cm3: m.density_g_cm3,
        viscosity: (m.viscosityFactor && Number(m.viscosityFactor) >= 1.2) ? 'alta' : 'media'
    };
}
export function getMaterialCodes() {
    return materialCatalog.map(m => m.id);
}
export function getViscosityFactor(mvr) {
    if (typeof mvr !== 'number') return { speedFactor: 1.0, pressureFactor: 1.0 };
    if (mvr <= 15) return { speedFactor: 0.8, pressureFactor: 1.2 };
    if (mvr <= 25) return { speedFactor: 1.0, pressureFactor: 1.0 };
    return { speedFactor: 1.2, pressureFactor: 0.9 };
}
