import type { RecipeSnapshot } from "../recipeExport/recipeTypes";
import type { ProductionCsvRow } from "./types";
import type { CaseRecord } from "../caseBased/caseTypes";
import { buildCaseFromProductionRow } from "../caseBased/buildCaseFromProductionRow";

export function casesFromProductionImport(opts: {
  rows: ProductionCsvRow[];
  snapshotFallback?: RecipeSnapshot;
  createdAt?: string;
}): CaseRecord[] {
  const createdAt = opts.createdAt ?? new Date().toISOString();

  const fallback: RecipeSnapshot =
    opts.snapshotFallback ??
    ({
      meta: { projectName: "Imported production outcomes", timestampISO: new Date().toISOString(), appVersion: "dev" },
      input: {},
      output: {},
      warnings: [],
      assumptions: [],
      defect: null,
    } as any);

  return opts.rows
    .filter((r) => !!(r.recipeFingerprint || r.recipeId))
    .map((row, idx) => {
      const snap: RecipeSnapshot = {
        ...fallback,
        meta: {
          ...(fallback.meta as any),
          recipeFingerprint: row.recipeFingerprint ?? row.recipeId,
        } as any,
      } as any;

      return buildCaseFromProductionRow({
        row,
        snapshot: snap,
        createdAt,
        idSeed: `import:${idx}`,
      });
    });
}
