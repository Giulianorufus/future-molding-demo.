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
