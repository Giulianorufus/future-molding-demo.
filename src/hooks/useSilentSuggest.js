import { useEffect, useRef } from "react";
import { suggestInjectionProfile } from "../utils/suggestInjectionProfile";
import { warn as logWarn } from '@/lib/log';
export function useSilentSuggest(inputs, api, touchedRef) {
    const lastKey = useRef("");
    useEffect(() => {
        if (!inputs || !api || !touchedRef)
            return;
        const key = JSON.stringify(inputs);
        if (key === lastKey.current)
            return;
        lastKey.current = key;
        try {
            const out = suggestInjectionProfile(inputs);
            const t = touchedRef.current || {};
            // num tappe
            if (!t.numSteps && api.setNumSteps) {
                api.setNumSteps(out.steps);
            }
            // valori per tappe
            for (let i = 0; i < out.steps; i++) {
                if ((!t[`step_${i}_speed`] || !t[`step_${i}_switch`]) && api.setStep) {
                    api.setStep(i, {
                        speedCm3s: out.speedsCm3s[i] || 120,
                        switchPosCm3: out.switchesCm3[i] ?? 0,
                    });
                }
                if (!t[`step_${i}_press`] && api.setPressure) {
                    api.setPressure(i, out.pressuresBar[i] || 800);
                }
            }
        }
        catch (error) {
            logWarn("useSilentSuggest calculation error:", error);
        }
    }, [inputs, api, touchedRef]);
}
