import { useEffect, useCallback } from "react";
export function useInjectionCalculation({ params, onResult, userTouched }) {
    const calculateInjection = useCallback(() => {
        const { volumeCarica, cuscino, margine, materiale, spessore, vdotMax, pmax } = params;
        // Calculate Pc
        const pc = cuscino + margine;
        // Calculate Vfill
        const Vfill = volumeCarica - pc;
        // Determine number of steps based on complexity
        let tappe = 1;
        if (spessore < 1.2 || materiale === "PC" || materiale === "PA-GF") {
            tappe = 3;
        }
        else if (spessore < 2.0 || ["ABS", "PBT", "POM"].includes(materiale)) {
            tappe = 2;
        }
        // Calculate steps
        const steps = [];
        // Material viscosity factor
        const viscosityFactor = (() => {
            switch (materiale) {
                case "PP":
                case "PE":
                case "PS": return 0.8;
                case "PC":
                case "PA-GF":
                case "PBT": return 1.3;
                case "PMMA":
                case "POM": return 1.1;
                default: return 1.0; // ABS, TPU
            }
        })();
        if (tappe === 1) {
            const velocita = Math.min(vdotMax, Math.max(30, 120 / viscosityFactor));
            const pressione = Math.min(pmax, Math.round(6.5 * velocita * viscosityFactor + 100));
            steps.push({
                velocita: Math.round(velocita),
                posizione: 0,
                pressione
            });
        }
        else if (tappe === 2) {
            // First step: 70% of Vfill
            const pos1 = Math.round(Vfill * 0.7);
            const vel1 = Math.min(vdotMax, Math.max(40, 150 / viscosityFactor));
            const press1 = Math.min(pmax, Math.round(6.5 * vel1 * viscosityFactor + 100));
            // Second step: remaining
            const vel2 = Math.min(vdotMax, Math.max(20, 80 / viscosityFactor));
            const press2 = Math.min(pmax, Math.round(6.5 * vel2 * viscosityFactor + 100));
            steps.push({ velocita: Math.round(vel1), posizione: pos1, pressione: press1 }, { velocita: Math.round(vel2), posizione: 0, pressione: press2 });
        }
        else { // 3 steps
            const pos1 = Math.round(Vfill * 0.5);
            const pos2 = Math.round(Vfill * 0.85);
            const vel1 = Math.min(vdotMax, Math.max(50, 180 / viscosityFactor));
            const vel2 = Math.min(vdotMax, Math.max(30, 120 / viscosityFactor));
            const vel3 = Math.min(vdotMax, Math.max(15, 60 / viscosityFactor));
            const press1 = Math.min(pmax, Math.round(6.5 * vel1 * viscosityFactor + 100));
            const press2 = Math.min(pmax, Math.round(6.5 * vel2 * viscosityFactor + 100));
            const press3 = Math.min(pmax, Math.round(6.5 * vel3 * viscosityFactor + 100));
            steps.push({ velocita: Math.round(vel1), posizione: pos1, pressione: press1 }, { velocita: Math.round(vel2), posizione: pos2, pressione: press2 }, { velocita: Math.round(vel3), posizione: 0, pressione: press3 });
        }
        onResult({ pc, tappe, steps });
    }, [params, onResult]);
    useEffect(() => {
        if (params.volumeCarica > 0 && params.cuscino >= 0 && params.margine >= 0) {
            calculateInjection();
        }
    }, [calculateInjection]);
}
