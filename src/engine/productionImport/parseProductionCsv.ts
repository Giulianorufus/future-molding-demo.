import Papa from "papaparse";
import type { ProductionCsvRow, ProductionImportResult } from "./types";

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function splitDefects(v: unknown): string[] | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const parts = s.split(/[;,|]/g).map(x => x.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return undefined;
}

export function parseProductionCsv(csvText: string): ProductionImportResult {
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors?.length) {
    warnings.push(
      ...parsed.errors.map(e => `CSV parse: riga ${e.row ?? "?"} — ${e.message}`)
    );
  }

  const rows: ProductionCsvRow[] = [];
  for (const rec of parsed.data ?? []) {
    if (!rec || Object.keys(rec).length === 0) continue;

    const recipeId = pickStr(rec, ["recipeId", "recipe_id", "idRicetta", "ricettaId"]);
    const recipeFingerprint = pickStr(rec, ["recipeFingerprint", "fingerprint", "hash", "recipe_hash"]);

    const producedQty = toNumber(pickStr(rec, ["producedQty", "produced", "qty_ok", "buoni", "pezzi_buoni"]));
    const scrapQty = toNumber(pickStr(rec, ["scrapQty", "scrap", "qty_scarti", "scarti", "pezzi_scartati"]));

    const defect = pickStr(rec, ["defect", "difetto", "scarto_causa"]);
    const defects = splitDefects(pickStr(rec, ["defects", "difetti", "scarti_cause"]));

    const cycleTime_s = toNumber(pickStr(rec, ["cycleTime_s", "cycleTime", "t_ciclo_s", "tempo_ciclo_s"]));
    const coolingTime_s = toNumber(pickStr(rec, ["coolingTime_s", "coolingTime", "t_raffredd_s", "tempo_raffredd_s"]));

    const row: ProductionCsvRow = {
      recipeId,
      recipeFingerprint,
      partName: pickStr(rec, ["partName", "pezzo", "articolo", "codice_articolo"]),
      pressId: pickStr(rec, ["pressId", "press", "pressa", "macchina"]),
      materialId: pickStr(rec, ["materialId", "material", "materiale"]),
      producedQty,
      scrapQty,
      defect,
      defects,
      cycleTime_s,
      coolingTime_s,
      notes: pickStr(rec, ["notes", "note", "osservazioni"]),
      _raw: rec,
    };

    const hasAnyId = !!(row.recipeId || row.recipeFingerprint);
    const hasAnyOutcome = row.producedQty !== undefined || row.scrapQty !== undefined || !!row.defect || (row.defects?.length);
    if (!hasAnyId && !hasAnyOutcome) continue;

    if (!hasAnyId) warnings.push("Riga senza recipeId/fingerprint: sarà 'unmatched' se non si implementa matching avanzato.");
    rows.push(row);
  }

  return { rows, warnings };
}
