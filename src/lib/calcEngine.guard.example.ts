// ESEMPIO: integra le guardie nel tuo calcEngine reale.
// Copia solo i pattern se hai già un file calcEngine.ts.
import { assert } from "@/lib/assert";

export type SwitchPointInput = {
  cavityVolumeCm3: number;
  runnerVolumeCm3: number;
  targetCushionCm3: number;
  shrinkagePct?: number; // opzionale
};

export function computeSwitchPointSafe(inp: SwitchPointInput) {
  assert(inp.cavityVolumeCm3 >= 0, "Volume cavità negativo");
  assert(inp.runnerVolumeCm3 >= 0, "Volume materozza negativo");
  assert(inp.targetCushionCm3 >= 0, "Cushion negativo");
  const shrink = typeof inp.shrinkagePct === "number" ? (1 + inp.shrinkagePct / 100) : 1;
  const v = (inp.cavityVolumeCm3 + inp.runnerVolumeCm3) * shrink - inp.targetCushionCm3;
  return Math.max(0, Number.isFinite(v) ? v : 0);
}