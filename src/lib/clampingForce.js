export function estimateClampingFromCad(params) {
    const { projectedArea_cm2, cavities, p_eff_bar } = params;
    // Effective pressure calculation (accounts for runner pressure drop)
    const P_eff_bar = p_eff_bar * 0.85; // 15% pressure drop assumption
    // Force calculation: F = P * A
    const F_req_kN = (projectedArea_cm2 * cavities * P_eff_bar * 0.1);
    // Safety factor 1.15
    const F_req_sic_kN = F_req_kN * 1.15;
    return {
        F_req_kN: Math.round(F_req_kN),
        F_req_sic_kN: Math.round(F_req_sic_kN),
        P_eff_bar: Math.round(P_eff_bar)
    };
}
export function autoAntiFlashAdjust(current, limits, clampingData) {
    const { F_req_sic_kN } = clampingData;
    const { F_pressa_kN, Vdot_max, Pmax } = limits;
    // If clamping force is sufficient, no adjustments needed
    if (F_req_sic_kN <= F_pressa_kN) {
        return {
            speedsCm3s: current.speedsCm3s,
            pressuresBar: current.pressuresBar,
            Pc_adjusted: current.Pc,
            temp_nozzle_adjustment: 0,
            flashWarning: ""
        };
    }
    // Calculate adjustments to reduce flash risk
    const adjustedSpeeds = current.speedsCm3s.map((speed, i) => {
        let adjusted = speed;
        // Reduce first stage speed by 10%
        if (i === 0) {
            adjusted *= 0.9;
        }
        // Clamp to limits
        return Math.max(10, Math.min(Vdot_max, adjusted));
    });
    const adjustedPressures = current.pressuresBar.map(pressure => {
        // Reduce pressures by 150 bar
        const adjusted = pressure - 150;
        return Math.max(200, Math.min(Pmax, adjusted));
    });
    // Increase cushion by 10%
    const Pc_adjusted = Math.min(current.Vcar * 0.8, current.Pc * 1.1);
    // Reduce nozzle temperature by 10°C
    const temp_nozzle_adjustment = -10;
    const forceDeficit = F_req_sic_kN - F_pressa_kN;
    const flashWarning = `⚠️ Rischio bave: forza richiesta ~${F_req_sic_kN} kN > pressa ${F_pressa_kN} kN. Parametri adattati.`;
    return {
        speedsCm3s: adjustedSpeeds.map(s => Math.round(s * 10) / 10),
        pressuresBar: adjustedPressures,
        Pc_adjusted: Math.round(Pc_adjusted * 100) / 100,
        temp_nozzle_adjustment,
        flashWarning
    };
}
export function analyzeRunnerSystem(runnerData, material) {
    const { runnerType = "cold", runnerDiam_mm = 6, runnerLen_mm = 100, gateDiam_mm = 1.0, nCav = 1 } = runnerData;
    // Pressure drop calculation (simplified Hagen-Poiseuille)
    const viscosityFactor = material.viscosity === "alta" ? 1.5 :
        material.viscosity === "bassa" ? 0.7 : 1.0;
    const pressureDrop_bar = (runnerLen_mm / Math.pow(runnerDiam_mm, 4)) *
        viscosityFactor * nCav * 20;
    // Speed adjustment for multiple cavities and gate restriction
    const gateRestriction = gateDiam_mm < 1.2 ? 1.2 : 1.0;
    const speedMultiplier = Math.max(0.8, Math.min(1.3, gateRestriction * Math.sqrt(nCav)));
    // Temperature adjustment for hot runners
    const temperatureAdjustment = runnerType === "hot" ? 10 : 0;
    return {
        pressureDrop_bar: Math.round(pressureDrop_bar),
        speedMultiplier: Math.round(speedMultiplier * 100) / 100,
        temperatureAdjustment
    };
}
