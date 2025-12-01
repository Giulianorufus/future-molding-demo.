/* =============================================================================
   Future Molding – Libreria materiali (parametri Cross-WLF + fisici base)
   Fonte: letteratura tecnica (Moldflow, MDPI, ResearchGate)
   NB: valori generici → vanno raffinati con dati di grado specifico
============================================================================= */
export const MATERIAL_LIBRARY = [
    {
        key: 'ABS_generic',
        name: 'ABS (generic)',
        density_gcm3: 0.94,
        Tg_C: 100,
        thermalCond_WmK: 0.18,
        specificHeat_JkgK: 345,
        crossWLF: {
            n: 0.33,
            tauStar: 2.9e4,
            D1: 3.6e5,
            A1: 27.21,
            A2: 92.85,
            Tref: 373
        }
    },
    {
        key: 'PP_generic',
        name: 'PP (generic)',
        density_gcm3: 0.74,
        Tm_C: 165,
        thermalCond_WmK: 0.22,
        specificHeat_JkgK: 1900,
        crossWLF: {
            n: 0.25,
            tauStar: 5.0e4,
            D1: 1.5e5,
            A1: 8.86,
            A2: 101.6,
            Tref: 373
        }
    },
    {
        key: 'PA66_GF40',
        name: 'PA66 + 40% GF (generic)',
        density_gcm3: 1.38,
        Tm_C: 260,
        thermalCond_WmK: 0.30,
        specificHeat_JkgK: 1700,
        crossWLF: {
            n: 0.20,
            tauStar: 8.0e4,
            D1: 2.2e5,
            A1: 10.5,
            A2: 65,
            Tref: 373
        }
    },
    {
        key: 'PC_generic',
        name: 'PC (generic)',
        density_gcm3: 1.18,
        Tg_C: 150,
        thermalCond_WmK: 0.19,
        specificHeat_JkgK: 1200,
        crossWLF: {
            n: 0.23,
            tauStar: 7.0e4,
            D1: 4.0e5,
            A1: 13.5,
            A2: 45,
            Tref: 423
        }
    }
];
export const TONNAGE_GUIDE = [
    { shot_g: 125, tonnage_t: 80 },
    { shot_g: 200, tonnage_t: 120 },
    { shot_g: 300, tonnage_t: 160 },
    { shot_g: 400, tonnage_t: 200 },
    { shot_g: 500, tonnage_t: 250 }
];
/**
 * Stima tonnellaggio da peso in grammi
 */
export function estimateTonnage(shot_g) {
    for (let i = 0; i < TONNAGE_GUIDE.length; i++) {
        if (shot_g <= TONNAGE_GUIDE[i].shot_g)
            return TONNAGE_GUIDE[i].tonnage_t;
    }
    // extrapola linearmente
    const last = TONNAGE_GUIDE[TONNAGE_GUIDE.length - 1];
    return Math.round(last.tonnage_t * (shot_g / last.shot_g));
}
