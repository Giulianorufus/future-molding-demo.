import { CalculationInput } from './calcEngine'

export type DefectRule = {
  id: string
  name: string
  description?: string
  apply: (input: CalculationInput) => CalculationInput
}

export const rules: DefectRule[] = [
  {
    id: 'short-shot',
    name: 'Short shot',
    description: 'Reduce shot volume by 10%',
    apply(input) {
      const clone = { ...input }
      if (clone.shotVolumeCm3) clone.shotVolumeCm3 = clone.shotVolumeCm3 * 0.9
      return clone
    },
  },
  {
    id: 'flash',
    name: 'Flash',
    description: 'Increase clamp force requirement by 10%',
    apply(input) {
      return { ...input }
    },
  },
]

export function applyRule(ruleId: string, input: CalculationInput): CalculationInput {
  const r = rules.find((x) => x.id === ruleId)
  return r ? r.apply(input) : input
}

export default { rules, applyRule }

import type { AppliedCorrection } from "../engine/defectApply";

type Severity = "low" | "medium" | "high";

function sevMul(sev: Severity) {
  if (sev === "low") return 0.5;
  if (sev === "high") return 1.5;
  return 1.0;
}

export function getDefectCorrections(defectId: string, severity: Severity): AppliedCorrection[] {
  const d = rules.find((x) => x.id === defectId);
  if (!d) return [];

  const m = sevMul(severity);

  const rulesObj: any = (d as any).rules ?? (d as any).rule ?? (d as any).corrections ?? {};
  const out: AppliedCorrection[] = [];

  // if there are explicit rules mapping, use them
  if (rulesObj && typeof rulesObj === "object" && Object.keys(rulesObj).length > 0) {
    for (const [field, spec] of Object.entries(rulesObj)) {
      let op: any;
      let value: number;
      let priority = 50;
      let reason = d.description ?? d.name ?? "defect fix";

      if (spec && typeof spec === "object" && "op" in (spec as any) && "value" in (spec as any)) {
        op = (spec as any).op;
        value = Number((spec as any).value);
        if ((spec as any).priority) priority = Number((spec as any).priority);
        if ((spec as any).reason) reason = String((spec as any).reason);
      } else {
        const n = Number(spec);
        if (n > 0.8 && n < 1.4) {
          op = "mul";
          value = 1 + (n - 1) * m;
        } else {
          op = "add";
          value = n * m;
        }
      }

      const id = `defect:${defectId}:${field}`;

      out.push({
        id,
        source: "defect",
        defectId,
        severity,
        field,
        op,
        value,
        priority,
        reason,
      });
    }
    return out;
  }

  // fallback heuristics for some known defect ids
  if ((d as any).id === "flash") {
    const field = "holdingPressureBar";
    const id = `defect:${defectId}:${field}`;
    const value = Math.round(80 * m);
    out.push({ id, source: "defect", defectId, severity, field, op: "add", value, priority: 60, reason: d.description ?? d.name ?? "flash" });
    return out;
  }

  return out;
}
