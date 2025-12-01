import { useState } from "react";
import { createAudit, saveAudit } from "@/utils/audit";
import { validateRun } from "@/utils/validation";
export function useCalcAudit() {
    const [audit, setAudit] = useState(undefined);
    async function runWithAudit(inputs, calculator, derive) {
        const { audit, step, setDerived, setOutputs, setValidations, finish } = createAudit(inputs);
        if (derive) {
            try {
                setDerived(derive(inputs));
            }
            catch { }
        }
        step("Inizio calcolo", { inputs });
        let outputs;
        try {
            outputs = await calculator(inputs);
            setOutputs(outputs);
            step("Fine calcolo", { outputs });
        }
        catch (err) {
            step("Errore calcolo", { message: err?.message ?? String(err) }, "error");
            setOutputs({});
            const done = finish();
            setAudit(done);
            saveAudit(done);
            throw err;
        }
        const validations = validateRun(inputs, outputs);
        if (validations.length) {
            validations.forEach(v => step("Validazione", v, v.severity === "high" ? "error" : "warn"));
        }
        setValidations(validations);
        const done = finish();
        setAudit(done);
        saveAudit(done);
        return { outputs, audit: done };
    }
    return { audit, runWithAudit };
}
