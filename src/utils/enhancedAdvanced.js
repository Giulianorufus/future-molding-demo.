/* ========================= FUTURE MOLDING – PATCH AVANZATA =========================
   Estensioni algoritmiche: Shear Heating, Residence Time, Line Loss, Startup,
   Warpage Risk, Throughput/Energy
===================================================================================== */
// 1) Shear heating correction (ΔT_eff)
function applyShearHeating(eta_PaS, gamma_s, baseTmelt_C) {
    // coefficiente empirico k ≈ 1e-5 (°C·s/Pa)
    const k = 1e-5;
    const dT = k * eta_PaS * Math.max(gamma_s, 1);
    return baseTmelt_C + Math.min(dT, 20); // max +20 °C
}
// 2) Residence time estimate
function estimateResidenceTime_s(machine, shotVol_cm3, screwLtoD = 20) {
    const d_cm = machine.screwDiameter_mm / 10;
    const L_cm = d_cm * screwLtoD;
    const Vbarile_cm3 = Math.PI * (d_cm / 2) ** 2 * L_cm;
    const Vshot = Math.max(shotVol_cm3, 1);
    const cyclesToEmpty = Vbarile_cm3 / Vshot;
    // ciclo ~ 30s default → residence = cyclesToEmpty * 30
    return cyclesToEmpty * 30;
}
// 3) Line pressure loss (nozzle + runner)
function linePressureLoss_bar(hotRunner, runnerVol_cm3 = 0) {
    let loss = hotRunner ? 40 : 80;
    if (!hotRunner)
        loss += Math.min(runnerVol_cm3 * 2, 120);
    return loss;
}
// 4) Startup ramp factors (primi 20 cicli)
function startupRamp(cycleCount, val, type) {
    if (cycleCount < 20) {
        const f = type === 'pack' ? 0.9 : 0.95;
        return Math.round(val * f);
    }
    return val;
}
// 5) Warpage risk index
function computeWarpRisk(partTh_mm, pack1_bar, material, deltaT_percent) {
    const gf = (material === 'PA66_GF40') ? 1 : 0;
    const risk = 0.5 * deltaT_percent + 0.002 * pack1_bar + 15 * gf;
    let msg = '';
    if (risk > 60)
        msg = 'Alto rischio imbarcamento: ridurre pack 2° stadio, alzare T stampo, bilanciare raffreddamento.';
    else if (risk > 40)
        msg = 'Rischio medio imbarcamento: controllare simmetria raffreddamento e pack.';
    return { risk, msg };
}
// 6) Productivity & energy
function throughputAndEnergy(cycle_s, clamp_kN) {
    const pph = 3600 / cycle_s;
    // stima grezza consumo: 0.0003 kWh per kN·s
    const kWh = clamp_kN * cycle_s * 0.0003;
    return { pph, kWh: Number(kWh.toFixed(2)) };
}
// 7) Wrapper per arricchire EnhancedOutput
export function enhanceAdvanced(enh, inp, cycleCount = 100) {
    const out = { ...enh };
    // Shear heating
    const Tcorr = applyShearHeating(enh.viscosity_PaS, enh.shearRate_s, inp.meltTemp_C);
    if (Tcorr - inp.meltTemp_C > 8) {
        out.warnings.push(`Riscaldamento viscoso stimato +${(Tcorr - inp.meltTemp_C).toFixed(1)} °C → controllare T effettiva melt.`);
    }
    // Residence time
    const tres = estimateResidenceTime_s(inp.machine, inp.shotVolume_cm3);
    if ((inp.material === 'PA66_GF40' && tres > 480) || (inp.material === 'PC' && tres > 720)) {
        out.warnings.push(`Tempo residenza stimato ${Math.round(tres / 60)} min troppo alto per ${inp.material} → rischio degradazione.`);
    }
    // Line loss
    const dPloss = linePressureLoss_bar(!!inp.hotRunner, inp.runnerVolume_cm3);
    const PinjCav = enh.injPressure_bar - dPloss;
    if (PinjCav < enh.injPressure_bar * 0.85) {
        out.notes.push(`Perdita pressione linea ~${dPloss} bar, pressione cavità ≈ ${Math.round(PinjCav)} bar.`);
    }
    // Startup ramp
    if (cycleCount < 20) {
        out.notes.push(`Startup: pack e velocità ridotti per primi ${20 - cycleCount} cicli.`);
        out.packProfile = out.packProfile.map(p => ({ ...p, p_bar: startupRamp(cycleCount, p.p_bar, 'pack') }));
        out.velocityProfile = out.velocityProfile.map(v => ({ ...v, injSpeed_cm3s: startupRamp(cycleCount, v.injSpeed_cm3s, 'vel') }));
    }
    // Warpage
    const { risk, msg } = computeWarpRisk(inp.partThickness_mm, out.packProfile[0].p_bar, inp.material, 30);
    if (msg)
        out.warnings.push(msg);
    // Productivity
    const cycle_s = out.coolingTime_s + 3 + 2; // cool + iniezione + apertura/estrazione
    const { pph, kWh } = throughputAndEnergy(cycle_s, out.clampForce_kN);
    out.notes.push(`Produttività ≈ ${pph.toFixed(1)} pz/h, consumo ≈ ${kWh} kWh/ciclo (stima).`);
    return out;
}
export const MACHINE_PROFILES = [
    {
        key: 'GEN-50T-Ø18',
        label: 'Generic 50T / Ø18',
        clamp_t: 50,
        screwDiameter_mm: 18,
        shotStroke_cm3: 28,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3s: 45,
        plasticizingRate_kg_h: 4.5,
        notes: 'Macchina piccola, vite Ø18: adatta a pezzi <20–25 cm³'
    },
    {
        key: 'GEN-100T-Ø25',
        label: 'Generic 100T / Ø25',
        clamp_t: 100,
        screwDiameter_mm: 25,
        shotStroke_cm3: 60,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3s: 70,
        plasticizingRate_kg_h: 8
    },
    {
        key: 'GEN-150T-Ø30',
        label: 'Generic 150T / Ø30',
        clamp_t: 150,
        screwDiameter_mm: 30,
        shotStroke_cm3: 120,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3s: 95,
        plasticizingRate_kg_h: 12
    },
    {
        key: 'GEN-200T-Ø40',
        label: 'Generic 200T / Ø40',
        clamp_t: 200,
        screwDiameter_mm: 40,
        shotStroke_cm3: 220,
        maxInjectionPressure_bar: 2200,
        maxInjectionSpeed_cm3s: 130,
        plasticizingRate_kg_h: 18,
        notes: 'Buona per multi-impronta medie, attenzione a plastificazione vs raffreddamento'
    }
];
/** Helper: trova un profilo per key */
export function getMachineProfile(key) {
    return MACHINE_PROFILES.find(m => m.key === key);
}
export const CSV_TEMPLATE_HEADER = `material_key,machine_key,hot_runner,part_thickness_mm,gate_type,gate_thickness_mm,gate_width_mm,gate_diameter_mm,mold_temp_C,melt_temp_C,flow_length_mm,shot_volume_cm3,runner_volume_cm3,inj_speed_cm3s,measured_Pinj_bar,measured_cooling_s,measured_part_weight_g`;
export const CSV_TEMPLATE_EXAMPLE_ROW = `PP_generic,GEN-100T-Ø25,no,2.5,pin,, ,1.2,80,230,120,38,6,40,1020,14,22.4`;
/* ====================== Parser CSV minimale (no dipendenze) ====================== */
function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2)
        return [];
    const header = lines[0].split(',').map(s => s.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i].trim();
        if (!raw)
            continue;
        const cols = raw.split(',').map(s => s.trim());
        const get = (name) => cols[header.indexOf(name)] ?? '';
        const row = {
            material_key: get('material_key'),
            machine_key: get('machine_key'),
            hot_runner: (get('hot_runner')?.toLowerCase() === 'yes' ? 'yes' : 'no'),
            part_thickness_mm: Number(get('part_thickness_mm')),
            gate_type: get('gate_type') ?? 'edge',
            gate_thickness_mm: get('gate_thickness_mm') ? Number(get('gate_thickness_mm')) : undefined,
            gate_width_mm: get('gate_width_mm') ? Number(get('gate_width_mm')) : undefined,
            gate_diameter_mm: get('gate_diameter_mm') ? Number(get('gate_diameter_mm')) : undefined,
            mold_temp_C: Number(get('mold_temp_C')),
            melt_temp_C: Number(get('melt_temp_C')),
            flow_length_mm: Number(get('flow_length_mm')),
            shot_volume_cm3: Number(get('shot_volume_cm3')),
            runner_volume_cm3: get('runner_volume_cm3') ? Number(get('runner_volume_cm3')) : undefined,
            inj_speed_cm3s: Number(get('inj_speed_cm3s')),
            measured_Pinj_bar: Number(get('measured_Pinj_bar')),
            measured_cooling_s: Number(get('measured_cooling_s')),
            measured_part_weight_g: get('measured_part_weight_g') ? Number(get('measured_part_weight_g')) : undefined
        };
        rows.push(row);
    }
    return rows;
}
/* ==================== Calibrazione: stima coefficienti medi ==================== */
/**
 * @param csvText  stringa CSV con header CSV_TEMPLATE_HEADER
 * @param simulate function(inputs)->{Pinj_bar,cooling_s} per ricalcolo teorico
 *                 NB: passa un wrapper che usa computeEnhancedParams(input)
 */
export function calibrateFromCSV(csvText, simulate) {
    const rows = parseCsv(csvText);
    const notes = [];
    if (!rows.length) {
        return { kVisc: 1, dP_line_bar: 60, kCool: 1, nRows: 0, notes: ['CSV vuoto o non valido'] };
    }
    const pinjRatios = [];
    const coolingRatios = [];
    const losses = [];
    for (const r of rows) {
        const sim = simulate(r);
        // rapporto per viscosità: vogliamo che Pinj_calc*kVisc - dP_line ≈ Pinj_meas
        // stimiamo prima una dP_line grezza da HR/runner, poi rifiniamo
        const guessLoss = (r.hot_runner === 'yes' ? 40 : 80) + (r.runner_volume_cm3 ? Math.min(r.runner_volume_cm3 * 2, 120) : 0);
        const kVisc_local = (r.measured_Pinj_bar + guessLoss) / Math.max(sim.Pinj_bar, 1);
        pinjRatios.push(kVisc_local);
        // perdita linea raffinata a posteriori: dP = Pinj_calc*kVisc - Pinj_meas
        const loss_local = (sim.Pinj_bar * kVisc_local) - r.measured_Pinj_bar;
        if (loss_local > 0)
            losses.push(loss_local);
        // raffreddamento: kCool = measured / calc
        const kCool_local = r.measured_cooling_s / Math.max(sim.cooling_s, 1);
        coolingRatios.push(kCool_local);
    }
    // medie robuste (trim 10%)
    const meanTrim = (arr) => {
        if (!arr.length)
            return 1;
        const s = [...arr].sort((a, b) => a - b);
        const cut = Math.floor(s.length * 0.1);
        const kept = s.slice(cut, s.length - cut || undefined);
        const m = kept.reduce((acc, v) => acc + v, 0) / kept.length;
        return Number(m.toFixed(3));
    };
    const kVisc = meanTrim(pinjRatios);
    const kCool = meanTrim(coolingRatios);
    const dP_line_bar = Math.max(0, Math.round(meanTrim(losses)));
    notes.push(`kVisc=${kVisc} (scala viscosità), dP_line=${dP_line_bar} bar, kCool=${kCool} (scala raffreddamento).`);
    notes.push(`Campioni validi: ${rows.length}.`);
    return { kVisc, dP_line_bar, kCool, nRows: rows.length, notes };
}
// Wrapper delegato alla versione TypeScript per evitare conflitti runtime.
export * from './enhancedAdvanced.ts';
