import { useMemo } from "react";
import { calculateParams } from "../utils/calcEngine";
export function useStableCalc(input, analysis) {
    return useMemo(() => {
        try {
            return calculateParams(input, analysis);
        }
        catch (e) {
            return null;
        }
    }, [input, analysis]);
}
