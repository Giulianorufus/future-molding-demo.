/* ======================= 1) NUOVO FILE =======================
   Path: src/lib/defects.ts
   Scopo: Gestione difetti → Δ parametri + clamp ai limiti
   ============================================================ */
const clampNum = (v, min, max) => {
    if (Number.isNaN(v))
        return v;
    let x = v;
    if (typeof min === 'number')
        x = Math.max(min, x);
    if (typeof max === 'number')
        x = Math.min(max, x);
    return x;
};
function clampToMachineAndMaterial(p, ml, mr, notes) {
    // Velocità iniezione
    if (Array.isArray(p.injSpeedSteps) && ml.maxInjectionSpeed_cm3s) {
        p.injSpeedSteps = p.injSpeedSteps.map((s) => clampNum(s, 0, ml.maxInjectionSpeed_cm3s));
    }
    else if (typeof p.injSpeed_cm3s === 'number' && ml.maxInjectionSpeed_cm3s) {
        p.injSpeed_cm3s = clampNum(p.injSpeed_cm3s, 0, ml.maxInjectionSpeed_cm3s);
    }
    // Pressioni
    if (typeof p.injPressure_bar === 'number' && ml.maxInjectionPressure_bar) {
        const before = p.injPressure_bar;
        p.injPressure_bar = clampNum(p.injPressure_bar, 0, ml.maxInjectionPressure_bar);
        if (p.injPressure_bar < before)
            notes.push('Pressione limitata dal max macchina');
    }
    if (Array.isArray(p.packPressures_bar) && ml.maxInjectionPressure_bar) {
        p.packPressures_bar = p.packPressures_bar.map((pp) => clampNum(pp, 0, ml.maxInjectionPressure_bar));
    }
    // Clamp (consiglio)
    if (typeof p.clamp_kN === 'number' && ml.clampForce_kN) {
        p.clamp_kN = clampNum(p.clamp_kN, 0, ml.clampForce_kN);
    }
    // Cushion
    if (typeof p.cushion_cm3 === 'number' && ml.minCushion_cm3) {
        p.cushion_cm3 = clampNum(p.cushion_cm3, ml.minCushion_cm3, undefined);
    }
    // Temperature (entro range materiale)
    const meltR = mr.meltRange_C;
    const moldR = mr.moldRange_C;
    if (typeof p.meltTemp_C === 'number' && meltR) {
        p.meltTemp_C = clampNum(p.meltTemp_C, meltR[0], meltR[1]);
    }
    if (typeof p.moldTemp_C === 'number' && moldR) {
        p.moldTemp_C = clampNum(p.moldTemp_C, moldR[0], moldR[1]);
    }
    if (typeof p.moldTempFixed_C === 'number' && moldR) {
        p.moldTempFixed_C = clampNum(p.moldTempFixed_C, moldR[0], moldR[1]);
    }
    if (typeof p.moldTempMoving_C === 'number' && moldR) {
        p.moldTempMoving_C = clampNum(p.moldTempMoving_C, moldR[0], moldR[1]);
    }
    return p;
}
// Helper sicuri: applicano Δ solo se il campo esiste
function addPercent(p, key, deltaPct) {
    if (typeof p[key] === 'number')
        p[key] = p[key] * (1 + deltaPct / 100);
}
function addSeconds(p, key, deltaS) {
    if (typeof p[key] === 'number')
        p[key] = p[key] + deltaS;
}
function addAbsolute(p, key, deltaAbs) {
    if (typeof p[key] === 'number')
        p[key] = p[key] + deltaAbs;
}
function shiftSwitchVolume(p, deltaPctOfShot) {
    if (typeof p.vToPSwitch_cm3 === 'number' && typeof p.shotVolume_cm3 === 'number') {
        p.vToPSwitch_cm3 = p.vToPSwitch_cm3 + p.shotVolume_cm3 * (deltaPctOfShot / 100);
    }
}
function scaleArray(p, key, deltaPct) {
    if (Array.isArray(p[key])) {
        p[key] = p[key].map((v) => (typeof v === 'number' ? v * (1 + deltaPct / 100) : v));
    }
}
export function applyDefectDeltas(baseParams, defects, machine, material) {
    const p = { ...baseParams };
    const notes = [];
    p.notes = Array.isArray(p.notes) ? [...p.notes] : [];
    // Ordine di priorità: sicurezza → riempimento → dimensionale → estetica
    const order = [
        'burn', 'flash',
        'short_shot', 'jetting',
        'sink', 'voids', 'warpage',
        'weld_line', 'splay',
        'ejection_scuff'
    ];
    const selected = order.filter(d => defects.includes(d));
    for (const d of selected) {
        switch (d) {
            case 'short_shot':
                scaleArray(p, 'injSpeedSteps', +15);
                addPercent(p, 'injPressure_bar', +10);
                scaleArray(p, 'packPressures_bar', +10);
                shiftSwitchVolume(p, +3);
                addAbsolute(p, 'meltTemp_C', +5);
                notes.push('Short shot: +velocità/+pressione, V→P ritardata, +5°C melt');
                break;
            case 'burn':
                scaleArray(p, 'injSpeedSteps', -15);
                addAbsolute(p, 'meltTemp_C', -5);
                addAbsolute(p, 'moldTemp_C', +5);
                addAbsolute(p, 'moldTempFixed_C', +3);
                addAbsolute(p, 'moldTempMoving_C', +3);
                notes.push('Bruciature: -velocità, -5°C melt, +5°C mold (miglior sfiato)');
                break;
            case 'flash':
                scaleArray(p, 'packPressures_bar', -15);
                addPercent(p, 'injPressure_bar', -10);
                addPercent(p, 'clamp_kN', +7);
                shiftSwitchVolume(p, -3);
                notes.push('Bave: -pack/-picco, +clamp, V→P anticipata');
                break;
            case 'sink':
                scaleArray(p, 'packPressures_bar', +12);
                addSeconds(p, 'packTime_s', +1.0);
                if (Array.isArray(p.packTimes_s))
                    p.packTimes_s = p.packTimes_s.map((t) => t + 0.7);
                addAbsolute(p, 'moldTemp_C', +5);
                addAbsolute(p, 'moldTempFixed_C', +3);
                addAbsolute(p, 'moldTempMoving_C', +3);
                notes.push('Segni ritiro: +pack/+tempo, +mold');
                break;
            case 'warpage':
                scaleArray(p, 'packPressures_bar', -10);
                addPercent(p, 'coolingTime_s', +12);
                // uniforma stampo se disponibili due metà
                if (typeof p.moldTempFixed_C === 'number' && typeof p.moldTempMoving_C === 'number') {
                    const avg = Math.round((p.moldTempFixed_C + p.moldTempMoving_C) / 2);
                    p.moldTempFixed_C = avg;
                    p.moldTempMoving_C = avg;
                    notes.push('Warpage: uniformate temperature stampo (Δ≤2°C)');
                }
                else {
                    addAbsolute(p, 'moldTemp_C', +3);
                    notes.push('Warpage: -pack, +cooling, +mold');
                }
                break;
            case 'weld_line':
                addAbsolute(p, 'meltTemp_C', +7);
                addAbsolute(p, 'moldTemp_C', +5);
                scaleArray(p, 'packPressures_bar', +10);
                scaleArray(p, 'injSpeedSteps', +10);
                notes.push('Weld line: +melt/+mold, +velocità step1, +pack');
                break;
            case 'splay':
                addAbsolute(p, 'meltTemp_C', -5);
                addPercent(p, 'backPressure_bar', -20);
                addPercent(p, 'screwRPM', -10);
                notes.push('Splay (umidità): -melt, -back-pressure, -rpm (essiccare materiale)');
                break;
            case 'voids':
                scaleArray(p, 'packPressures_bar', +12);
                addSeconds(p, 'packTime_s', +1.0);
                shiftSwitchVolume(p, +2);
                addPercent(p, 'coolingTime_s', +10);
                notes.push('Vuoti: +pack/+tempo, V→P ritardata, +cooling');
                break;
            case 'jetting':
                // riduci solo il primo step se presente
                if (Array.isArray(p.injSpeedSteps) && p.injSpeedSteps.length) {
                    p.injSpeedSteps[0] = p.injSpeedSteps[0] * 0.75;
                }
                else {
                    addPercent(p, 'injSpeed_cm3s', -25);
                }
                addAbsolute(p, 'moldTemp_C', +5);
                notes.push('Jetting: -velocità step1, +5°C mold');
                break;
            case 'ejection_scuff':
                addAbsolute(p, 'moldTempMoving_C', -4);
                if (Array.isArray(p.injSpeedSteps) && p.injSpeedSteps.length) {
                    p.injSpeedSteps[p.injSpeedSteps.length - 1] = p.injSpeedSteps[p.injSpeedSteps.length - 1] * 0.9;
                }
                addAbsolute(p, 'decompression_mm', +0.5);
                notes.push('Graffi in estrazione: mobile -4°C, -velocità finale, +decompressione');
                break;
        }
        // clamp dopo ogni difetto per sicurezza
        clampToMachineAndMaterial(p, machine, material, notes);
    }
    // Appendi note riassuntive
    if (notes.length)
        p.notes.push(`Correzioni difetti: ${notes.join(' · ')}`);
    return p;
}
