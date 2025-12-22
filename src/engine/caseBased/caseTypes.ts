import type { RecipeSnapshot } from "../recipeExport/recipeTypes";

export type ISODateString = string;

export type DefectCode = string;

export type OutcomeRecord = {
  producedQty?: number;
  scrapQty?: number;
  scrapRate_pct?: number; // se già calcolata da import
  cycleTime_s?: number;
  defects?: DefectCode[];
  notes?: string;
};

export type CaseRecord = {
  id: string;
  createdAt: ISODateString;

  // Fingerprint/Hash utile per match “ricetta”
  recipeFingerprint?: string;

  // Contesto processo (minimo)
  materialId?: string;
  pressId?: string;
  screwDiameter_mm?: number;

  // Contesto geometria (se disponibile)
  geometryHash?: string;
  projectedArea_cm2?: number;
  shotVolume_cm3?: number;

  // Snapshot completo già esistente nel progetto
  recipeSnapshot: RecipeSnapshot;

  // Esito produzione (da CSV/import o manuale)
  outcome?: OutcomeRecord;
};

export type CaseQuery = Pick<
  CaseRecord,
  | "recipeFingerprint"
  | "materialId"
  | "pressId"
  | "screwDiameter_mm"
  | "geometryHash"
  | "projectedArea_cm2"
  | "shotVolume_cm3"
>;

export type SimilarityResult = {
  caseId: string;
  score: number; // 0..100
  reasons: string[];
};
