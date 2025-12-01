import { CalcAudit, AuditStep, CalcInputs, CalcOutputs, ValidationIssue, AuditKV } from "@/types/audit";

export function newRunId() {
  const t = new Date().toISOString();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${t}-${r}`;
}

export function createAudit(inputs: CalcInputs) {
  const audit: CalcAudit = {
    runId: newRunId(),
    startedAt: Date.now(),
    inputs,
    steps: [],
  };

  function step(label: string, data?: AuditKV, level: AuditStep["level"] = "info") {
    audit.steps.push({ at: Date.now(), label, data, level });
  }

  function setDerived(data: AuditKV) {
    audit.derived = { ...(audit.derived ?? {}), ...data };
  }

  function setOutputs(outputs: CalcOutputs) {
    audit.outputs = outputs;
  }

  function setValidations(list: ValidationIssue[]) {
    audit.validations = list;
    audit.ok = list.every(v => v.severity !== "high");
  }

  function finish() {
    audit.finishedAt = Date.now();
    audit.durationMs = (audit.finishedAt ?? 0) - audit.startedAt;
    return audit;
  }

  return { audit, step, setDerived, setOutputs, setValidations, finish };
}

const KEY = "fm_audit_runs_v1";
export function saveAudit(a: CalcAudit) {
  try {
    const arr = loadAudits();
    arr.unshift(a);
    while (arr.length > 200) arr.pop();
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}
export function loadAudits(): CalcAudit[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CalcAudit[]) : [];
  } catch {
    return [];
  }
}