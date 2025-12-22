import type { RecipeSnapshot } from "../recipeExport/recipeTypes";
import type { ProductionCsvRow } from "../productionImport/types";
import type { CaseRecord, OutcomeRecord } from "./caseTypes";

function isoNow() {
  return new Date().toISOString();
}

function calcScrapRatePct(producedQty?: number, scrapQty?: number): number | undefined {
  if (producedQty === undefined || scrapQty === undefined) return undefined;
  const total = producedQty + scrapQty;
  if (total <= 0) return undefined;
  return (scrapQty / total) * 100;
}

function uniqStrings(arr?: string[]): string[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  const out = Array.from(new Set(arr.map((s) => String(s).trim()).filter(Boolean)));
  return out.length ? out : undefined;
}

export function buildCaseFromProductionRow(opts: {
  row: ProductionCsvRow;
  snapshot: RecipeSnapshot;
  createdAt?: string;
  idSeed?: string; // per test deterministici
}): CaseRecord {
  const createdAt = opts.createdAt ?? isoNow();
  const { row, snapshot } = opts;

  const defects = uniqStrings([row.defect, ...(row.defects ?? [])].filter(Boolean) as string[]);

  const outcome: OutcomeRecord = {
    producedQty: row.producedQty,
    scrapQty: row.scrapQty,
    scrapRate_pct: (row as any).scrapRate_pct ?? calcScrapRatePct(row.producedQty, row.scrapQty),
    cycleTime_s: row.cycleTime_s,
    defects,
    notes: row.notes,
  };

  const fingerprint = row.recipeFingerprint ?? row.recipeId;

  const idSeed = opts.idSeed ?? "case";
  const id = `${idSeed}:${fingerprint ?? "no-fp"}:${createdAt}`;

  return {
    id,
    createdAt,
    recipeFingerprint: fingerprint,
    materialId: row.materialId,
    pressId: row.pressId,
    recipeSnapshot: snapshot,
    outcome: Object.values(outcome).some((v) => v !== undefined && v !== null && v !== "")
      ? outcome
      : undefined,
  } as CaseRecord;
}
