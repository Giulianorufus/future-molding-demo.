export type ProductionCsvRow = {
  recipeId?: string;
  recipeFingerprint?: string;
  partName?: string;
  pressId?: string;
  materialId?: string;
  producedQty?: number;
  scrapQty?: number;
  defect?: string;
  defects?: string[];
  cycleTime_s?: number;
  coolingTime_s?: number;
  notes?: string;
  _raw?: Record<string, unknown>;
};

export type ProductionImportResult = {
  rows: ProductionCsvRow[];
  warnings: string[];
};

export type MatchedProductionRow = ProductionCsvRow & {
  match: "recipeId" | "fingerprint" | "unmatched";
};
