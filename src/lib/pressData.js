// --- Dati minimi per far funzionare Subito la pagina ---
const DB = {
    Arburg: [
        {
            brand: "Arburg",
            model: "370U",
            clampForce_kN: 700,
            screwDiameter_mm: 35,
            maxShot_cm3: 150,
            maxInjectionSpeed_cm3s: 120,
            maxInjectionPressure_bar: 2000,
            minCushion_cm3: 10,
        },
        {
            brand: "Arburg",
            model: "170U",
            clampForce_kN: 200,
            screwDiameter_mm: 25,
            maxShot_cm3: 60,
            maxInjectionSpeed_cm3s: 90,
            maxInjectionPressure_bar: 2000,
            minCushion_cm3: 5,
        },
    ],
    Engel: [
        {
            brand: "Engel",
            model: "e-mac 170",
            clampForce_kN: 1700,
            screwDiameter_mm: 40,
            maxShot_cm3: 200,
            maxInjectionSpeed_cm3s: 160,
            maxInjectionPressure_bar: 2200,
            minCushion_cm3: 15,
        },
    ],
    "Generic": [
        {
            brand: "Generic",
            model: "250",
            clampForce_kN: 250,
            screwDiameter_mm: 30,
            maxShot_cm3: 80,
            maxInjectionSpeed_cm3s: 100,
            maxInjectionPressure_bar: 1800,
            minCushion_cm3: 8,
        },
    ],
};
// Export PRESSES per compatibilità
export const PRESSES = DB;
// --- API semplici usate da Parametri.tsx ---
export function getBrands() {
    return Object.keys(DB);
}
export function getModels(brand) {
    const list = DB[brand] ?? [];
    return list.map((p) => p.model);
}
export function getPressSpecs(brand, model) {
    const list = DB[brand] ?? [];
    return list.find((p) => p.model === model);
}
