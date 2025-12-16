// src/types/appliedCorrection.ts

export type CorrectionType =
  | "defect"
  | "pressLimit"
  | "clampMitigation"
  | "clampTune"
  | "estimate";

export type CorrectionAction = "set" | "clamp" | "increase" | "decrease";

export type AppliedCorrection = {
  /** chiave deterministica, es: "pressLimit:injectionSpeed_cm3_s" */
  id: string;

  type: CorrectionType;
  target: string; // es: "packingPressure_bar"
  action: CorrectionAction;

  unit?: string;

  before?: number;
  after?: number;
  delta?: number;

  reason?: string;
  source?: string;

  meta?: Record<string, unknown>;
};

export default AppliedCorrection;
