import { useMemo } from "react";
import { calculateParams, type InputData, type AnalysisData } from "../utils/calcEngine";

export function useStableCalc(input: InputData, analysis: AnalysisData) {
  return useMemo(() => {
    try {
      return calculateParams(input, analysis);
    } catch (e) {
      return null;
    }
  }, [input, analysis]);
}