export function convertForPress({ pressBrand, screwDiam_mm, Vdot_cm3s, Pc_cm3, commutazione_cm3, pressures_bar, k_trans = 10 }) {
    const A = Math.PI * Math.pow((screwDiam_mm || 25) / 2, 2);
    const MM3_PER_CM3 = 1000;
    let out = {
        velocita: 0,
        velUnit: "cm³/s",
        pc: 0,
        pcUnit: "cm³",
        commutazione: 0,
        commUnit: "cm³",
        pressioni: [],
        pressUnit: "bar materiale"
    };
    const vdot = Vdot_cm3s || 0;
    const pc = Pc_cm3 || 0;
    const comm = commutazione_cm3 || 0;
    const pressures = pressures_bar || [];
    switch ((pressBrand || "").toLowerCase()) {
        case "fanuc":
        case "sumitomo":
        case "toyo":
            out.velocita = Math.round((vdot * MM3_PER_CM3) / A);
            out.velUnit = "mm/s vite";
            out.pc = Math.round((pc * MM3_PER_CM3) / A);
            out.pcUnit = "mm vite";
            out.commutazione = Math.round((comm * MM3_PER_CM3) / A);
            out.commUnit = "mm vite";
            out.pressioni = pressures;
            out.pressUnit = "bar materiale";
            break;
        case "negribossi":
        case "sandretto":
            out.velocita = vdot;
            out.velUnit = "cm³/s (stima)";
            out.pc = Math.round((pc * MM3_PER_CM3) / A);
            out.pcUnit = "mm vite";
            out.commutazione = Math.round((comm * MM3_PER_CM3) / A);
            out.commUnit = "mm vite";
            out.pressioni = pressures.map(p => Math.round(p / k_trans));
            out.pressUnit = "bar olio (stima)";
            if (vdot > 0)
                out.tempoIniezione_s = (pc / vdot).toFixed(2);
            break;
        case "ibrida":
            out.velocita = vdot;
            out.velUnit = "cm³/s";
            out.pc = Math.round((pc * MM3_PER_CM3) / A);
            out.pcUnit = "mm vite";
            out.commutazione = Math.round((comm * MM3_PER_CM3) / A);
            out.commUnit = "mm vite";
            out.pressioni = pressures;
            out.pressUnit = "bar materiale";
            break;
        case "arburg":
        case "engel":
        default:
            out.velocita = vdot;
            out.velUnit = "cm³/s";
            out.pc = pc;
            out.pcUnit = "cm³";
            out.commutazione = comm;
            out.commUnit = "cm³";
            out.pressioni = pressures;
            out.pressUnit = "bar materiale";
            break;
    }
    return out;
}
