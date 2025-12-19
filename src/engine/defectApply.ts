// src/engine/defectApply.ts
export type CorrectionOp = "set" | "add" | "mul" | "capMax" | "capMin";

export interface AppliedCorrection {
  id: string; // stable id for dedupe (e.g. defect:<id>:<field>)
  source: "defect";
  defectId: string;
  severity: "low" | "medium" | "high";
  field: string;
  op: CorrectionOp;
  value: number;
  priority: number; // higher wins on conflict
  reason: string;

  // audit
  before?: number;
  after?: number;
}

export interface DefectFixResult<T extends Record<string, any>> {
  patchedInput: T;
  appliedCorrections: AppliedCorrection[];
  audit: string[]; // short trace, human readable
}

function isFiniteNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function dedupeCorrections(corr: AppliedCorrection[]): AppliedCorrection[] {
  const seen = new Map<string, AppliedCorrection>();
  const order: string[] = [];
  for (const c of corr) {
    if (!seen.has(c.id)) order.push(c.id);
    const prev = seen.get(c.id);
    if (!prev || c.priority > prev.priority) seen.set(c.id, c);
  }
  return order.map((id) => seen.get(id)!).filter(Boolean);
}

export function resolveFieldConflicts(corr: AppliedCorrection[]): AppliedCorrection[] {
  const best = new Map<string, AppliedCorrection>();
  const order: string[] = [];
  for (const c of corr) {
    if (!best.has(c.field)) order.push(c.field);
    const prev = best.get(c.field);
    if (!prev || c.priority > prev.priority) best.set(c.field, c);
  }
  return order.map((f) => best.get(f)!).filter(Boolean);
}

export function applyCorrectionsToInput<T extends Record<string, any>>(
  baseInput: T,
  corrections: AppliedCorrection[]
): DefectFixResult<T> {
  const audit: string[] = [];
  const patched: any = { ...baseInput };

  for (const c of corrections) {
    const cur = patched[c.field];
    const before = isFiniteNum(cur) ? cur : undefined;

    const currentVal = isFiniteNum(cur) ? cur : c.op === "mul" ? 1 : c.op === "add" ? 0 : undefined;

    let next: number | undefined = before as any;

    if (c.op === "set") {
      next = c.value;
    } else if (c.op === "add") {
      next = isFiniteNum(currentVal) ? currentVal + c.value : undefined;
    } else if (c.op === "mul") {
      next = isFiniteNum(currentVal) ? currentVal * c.value : undefined;
    } else if (c.op === "capMax") {
      next = isFiniteNum(currentVal) ? Math.min(currentVal, c.value) : undefined;
    } else if (c.op === "capMin") {
      next = isFiniteNum(currentVal) ? Math.max(currentVal, c.value) : undefined;
    }

    const applied = { ...c, before, after: next } as AppliedCorrection;

    if (typeof next === "number" && Number.isFinite(next)) {
      patched[c.field] = next;
      audit.push(`${c.defectId}(${c.severity}): ${c.field} ${c.op} ${c.value} -> ${before ?? "n/a"} → ${next}`);
    } else {
      audit.push(`${c.defectId}(${c.severity}): skip ${c.field} (non-numeric)`);
    }

    Object.assign(c, applied);
  }

  return {
    patchedInput: patched as T,
    appliedCorrections: corrections,
    audit,
  };
}
