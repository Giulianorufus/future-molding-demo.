export type AuditKV = Record<string, unknown>;

export type AuditStep = {
  at: number;
  label: string;
  data?: AuditKV;
  level?: "info" | "warn" | "error";
};

export type CalcInputs = {
  pressId?: string;
  modelId?: string;
  screwDiameter_mm?: number;
  materialId?: string;
  partVolume_cm3?: number;
  cavities?: number;
};

export type CalcOutputs = {
  injectionSpeed_cm3s?: number;
  switchOver_cm3?: number;
  packPressure_bar?: number;
  moldTemp_C?: number;
  cooling_s?: number;
  clampForce_t?: number;
  notes?: string[];
  [k: string]: unknown;
};

export type ValidationIssue = {
  kind: "range" | "logic" | "missing" | "warning";
  field?: string;
  msg: string;
  severity: "low" | "medium" | "high";
};

export type CalcAudit = {
  runId: string;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  inputs: CalcInputs;
  derived?: AuditKV;
  steps: AuditStep[];
  outputs?: CalcOutputs;
  validations?: ValidationIssue[];
  ok?: boolean;
};