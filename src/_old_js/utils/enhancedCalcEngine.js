/* ========================= FUTURE MOLDING – BLOCCO "SOTTO BANCO" =========================
   Algoritmi 1–6: Reologia, Gate-Freeze/Pack, Clamp, Compatibilità Pressa,
                   Plastificazione vs Raffreddamento, Profili Velocità + Switch V→P
   Non richiede dipendenze. Safe defaults. Nessuna modifica alla UI necessaria.
=========================================================================================== */
const MAT = {
    PP: {
        D1: 1.5e5, A1: 8.86, A2: 101.6, Tstar: 373.15, tauStar: 50000, n: 0.25,
        rho: 0.74, alphaTherm: 0.12, Tm: 165
    },
    ABS: {
        D1: 3.0e5, A1: 12.5, A2: 50, Tstar: 373.15, tauStar: 65000, n: 0.22,
        rho: 1.03, alphaTherm: 0.10, Tg: 105
    },
    PA66_GF40: {
        D1: 2.2e5, A1: 10.5, A2: 65, Tstar: 373.15, tauStar: 80000, n: 0.20,
        rho: 1.38, alphaTherm: 0.09, Tm: 260
    },
    PC: {
        D1: 4.0e5, A1: 13.5, A2: 45, Tstar: 423.15, tauStar: 70000, n: 0.23,
        rho: 1.18, alphaTherm: 0.085, Tg: 150
    }
};
///////////////////////////
// 1) Reologia Cross-WLF lite
///////////////////////////
function eta0_PaS(mat, T_C) {
    const T = T_C + 273.15;
    const { D1, A1, A2, Tstar } = mat;
    const num = -A1 * (T - Tstar);
    const den = A2 + (T - Tstar);
    const log10 = num / den;
    const eta0 = D1 * Math.pow(10, log10); // Pa·s
    return Math.max(eta0, 500); // floor anti-outlier
}
function etaCross_PaS(mat, T_C, gamma_s) {
    const e0 = eta0_PaS(mat, T_C);
    const X = (e0 * Math.max(gamma_s, 1)) / mat.tauStar;
    return e0 / Math.pow(1 + Math.pow(X, (1 - mat.n)), 1);
}
///////////////////////////
// 2) Shear rate al gate (rettangolare o circolare) + Q
///////////////////////////
function estimateGateDims(gate, partTh_mm) {
    const h = gate.thickness_mm ?? Math.max(0.6, 0.8 * partTh_mm);
    const b = gate.width_mm ?? Math.min(2.0 * partTh_mm, 8);
    if (gate.type === 'pin' || gate.type === 'submarine') {
        const d = gate.diameter_mm ?? Math.max(0.6, 0.7 * partTh_mm);
        return { b_mm: b, h_mm: h, d_mm: d };
    }
    return { b_mm: b, h_mm: h, d_mm: null };
}
function shearRate_s(gate, partTh_mm, Q_cm3s) {
    const g = estimateGateDims(gate, partTh_mm);
    const Q_mm3s = Q_cm3s * 1000; // 1 cm3 = 1000 mm3
    if (g.d_mm) {
        // circolare: γ̇ ≈ 32 Q / (π d^3)
        return (32 * Q_mm3s) / (Math.PI * Math.pow(g.d_mm, 3));
    }
    // rettangolare: γ̇ ≈ 6 Q / (b h^2)
    return (6 * Q_mm3s) / (g.b_mm * Math.pow(g.h_mm, 2));
}
///////////////////////////
// 3) Pressione di iniezione "lite"
///////////////////////////
// ΔP ~ k_geom * η(γ̇,T) * γ̇   con k_geom basata su spessore e lunghezza di flusso
function injectionPressure_bar(eta_PaS, gamma_s, partTh_mm, flowLen_mm, hotRunner) {
    const kGeom = (flowLen_mm / Math.max(partTh_mm, 0.5)) * (hotRunner ? 0.9 : 1.0);
    const dP_Pa = 0.035 * kGeom * eta_PaS * Math.max(gamma_s, 1); // coeff. tarabile
    const bar = dP_Pa / 1e5;
    return Math.min(Math.max(bar, 300), 2200); // clamp 300–2200 bar
}
