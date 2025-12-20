import type { MatchedProductionRow, ProductionCsvRow } from "./types";

export function matchProductionRows(
  rows: ProductionCsvRow[],
  opts: {
    knownRecipeIds: Set<string>;
    knownFingerprints?: Set<string>;
  }
): MatchedProductionRow[] {
  const fp = opts.knownFingerprints ?? new Set<string>();

  return rows.map((r) => {
    if (r.recipeId && opts.knownRecipeIds.has(r.recipeId)) {
      return { ...r, match: "recipeId" };
    }
    if (r.recipeFingerprint && fp.has(r.recipeFingerprint)) {
      return { ...r, match: "fingerprint" };
    }
    return { ...r, match: "unmatched" };
  });
}
