import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { computeGateFreeze, type GateFreezePoint } from "../../src/engine/gateFreeze/gateFreezeStudy";

type AnyRow = Record<string, any>;

function pickNumber(row: AnyRow, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = row[k];
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizePoints(rows: AnyRow[]): { groupKey: string; points: GateFreezePoint[] }[] {
  // groupKey: prova fingerprint/partName/materialId, altrimenti "default"
  const groups = new Map<string, GateFreezePoint[]>();

  for (const r of rows) {
    const groupKey =
      r.recipeFingerprint ||
      r.fingerprint ||
      r.partName ||
      r.materialId ||
      r.group ||
      "default";

    const holdingTime_s = pickNumber(r, ["holdingTime_s", "holdingTime", "hold_s", "packHold_s"]);
    if (!holdingTime_s) continue;

    const weight_g = pickNumber(r, ["weight_g", "partWeight_g", "weight", "part_weight_g"]);
    const cycleTime_s = pickNumber(r, ["cycleTime_s", "cycleTime", "cycle_s"]);

    const pt: GateFreezePoint = { holdingTime_s, weight_g, cycleTime_s, sourceId: r.id || r.caseId };
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(pt);
  }

  return [...groups.entries()].map(([groupKey, points]) => ({ groupKey, points }));
}

function loadRowsFromJson(filePath: string): AnyRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  // accetta: array di righe o array di CaseRecord
  if (!Array.isArray(data)) throw new Error("JSON must be an array");

  // se sembra CaseRecord: estrai holdingTime/peso da recipeSnapshot/output o outcome
  if (data.length && data[0]?.recipeSnapshot) {
    return data.map((c: AnyRow) => {
      const out = c.recipeSnapshot?.output ?? {};
      return {
        id: c.id,
        recipeFingerprint: c.recipeFingerprint,
        partName: c.partName,
        materialId: c.materialId,
        // tentativi (da adattare se nel tuo output i nomi sono diversi)
        holdingTime_s: out.holdingTime_s ?? out.packingTime_s ?? out.holdTime_s,
        weight_g: c.partWeight_g ?? c.weight_g ?? c.outcome?.partWeight_g,
        cycleTime_s: c.cycleTime_s ?? c.outcome?.cycleTime_s,
      };
    });
  }

  return data;
}

function loadRowsFromCsv(filePath: string): AnyRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<AnyRow>(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    // non bloccare: ma segnala in console
    console.warn("CSV parse warnings:", parsed.errors.slice(0, 3));
  }
  return parsed.data ?? [];
}

function toCsv(rows: AnyRow[]): string {
  const header = Object.keys(rows[0] ?? {});
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(header.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf("--in");
  const outIdx = args.indexOf("--outDir");
  const input = inIdx >= 0 ? args[inIdx + 1] : "";
  const outDir = outIdx >= 0 ? args[outIdx + 1] : "scripts/gate-freeze/out";

  if (!input) {
    console.error('Usage: npm run dev:gate-freeze -- --in "<file1,file2>" --outDir "scripts/gate-freeze/out"');
    process.exit(1);
  }

  const inputs = input.split(",").map((s) => s.trim()).filter(Boolean);

  let rows: AnyRow[] = [];
  for (const f of inputs) {
    const ext = path.extname(f).toLowerCase();
    if (ext === ".json") rows = rows.concat(loadRowsFromJson(f));
    else if (ext === ".csv") rows = rows.concat(loadRowsFromCsv(f));
    else throw new Error(`Unsupported input: ${f}`);
  }

  const groups = normalizePoints(rows);

  const recs = groups.map(({ groupKey, points }) => {
    const r = computeGateFreeze(points);
    return {
      groupKey,
      recommendedHoldingTime_s: r.recommendedHoldingTime_s,
      plateauWeight_g: r.plateauWeight_g ?? null,
      eps_g: r.eps_g ?? null,
      confidence: r.confidence,
      method: r.method,
      nPoints: r.details.nPoints,
      usedKey: r.details.usedKey,
    };
  });

  fs.mkdirSync(outDir, { recursive: true });

  const outJson = path.join(outDir, "recommendations.json");
  fs.writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), recommendations: recs }, null, 2), "utf8");

  const outCsv = path.join(outDir, "recommendations.csv");
  fs.writeFileSync(outCsv, toCsv(recs), "utf8");

  console.log(`Wrote: ${outJson}`);
  console.log(`Wrote: ${outCsv}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
