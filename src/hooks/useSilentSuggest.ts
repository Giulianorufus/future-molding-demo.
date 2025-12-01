import React, { useEffect, useRef } from "react";
import * as log from '@/lib/log';
import { suggestInjectionProfile } from "../utils/suggestInjectionProfile";

interface SilentSuggestInputs {
  Vcar: number;
  Pc: number;
  t_mm: number;
  materiale: {
    tipo: string;
    viscosita: "bassa" | "media" | "alta";
  };
  estetico: boolean;
  zoneSottili: boolean;
  longRunner: boolean;
  difettiStorico: any[];
  Vdot_max: number;
  Pmax: number;
}

interface SilentSuggestApi {
  setNumSteps: (steps: number) => void;
  setStep: (i: number, patch: { speedCm3s: number; switchPosCm3: number }) => void;
  setPressure: (i: number, val: number) => void;
}

export function useSilentSuggest(
  inputs: SilentSuggestInputs, 
  api: SilentSuggestApi, 
  touchedRef: React.MutableRefObject<{ [key: string]: boolean }>
) {
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!inputs || !api || !touchedRef) return;
    
    const key = JSON.stringify(inputs);
    if (key === lastKey.current) return;
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
    } catch (error) {
      log.warn("useSilentSuggest calculation error:", error);
    }
  }, [inputs, api, touchedRef]);
}