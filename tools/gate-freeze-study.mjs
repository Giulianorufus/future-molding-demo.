#!/usr/bin/env node
/**
 * Gate Freeze Study (CSV → plateau → raccomandazione holding time)
 * - Input: uno o più CSV
 * - Output: out/gate-freeze/{summary.json, summary.csv, plots/*.html, aggregates/*.csv}
 *
 * Requisiti: npm i -D papaparse
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------
// CLI parsing (semplice)
// ------------------------
const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v ?? def;
};
const hasFlag = (name) => argv.includes(name);

const inArg = getArg("--in") || getArg("-i");
const outDir = getArg("--out") || getArg("-o") || "out/gate-freeze";
const sepArg = getArg("--sep") || "auto"; // auto | "," | ";" | "\t"
const seriesColsArg = getArg("--series") || ""; // es: material,press,moldId
const debug = hasFlag("--debug");
const holdColOverride = getArg("--hold-col");
const weightColOverride = getArg("--weight-col");
const cycleColOverride = getArg("--cycle-col");
const fingerprintCol = getArg("--fingerprint-col") || "recipeFingerprint";
const emitByFingerprint = (getArg("--emit-by-fingerprint") ?? "true") !== "false";

if (!inArg) {
  console.error(
    `Uso:
node tools/gate-freeze-study.mjs --in "data/*.csv" --out out/gate-freeze
Opzioni:
  --sep auto|,|;|\\t
  --hold-col "NomeColonna"
  --weight-col "NomeColonna"
  --cycle-col "NomeColonna"
  --series colA,colB,colC
  --debug`
  );
  process.exit(1);
}

// ------------------------
// Utility I/O
// ------------------------
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function readText(fp) {
  return fs.readFileSync(fp, "utf8");
}
function writeText(fp, s) {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, s, "utf8");
}
function globLike(input) {
  // supporto minimo: "dir/*.csv" oppure singolo file
  if (!input.includes("*")) {
    if (!fs.existsSync(input)) {
      console.error(`Input non trovato: ${input}`);
      return [];
    }
    return [input];
  }

  const dir = path.dirname(input);

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(
      `Directory inesistente per --in "${input}": ${dir}\n` +
      `Soluzione: crea la directory oppure passa un path corretto (es. "fixtures/*.csv").`
    );
    return [];
  }

  const patt = path.basename(input).replace(/\./g, "\\.").replace(/\*/g, ".*");
  const re = new RegExp(`^${patt}$`, "i");
  return fs.readdirSync(dir).filter((f) => re.test(f)).map((f) => path.join(dir, f));
}

// ------------------------
// CSV parsing + autodetect separatore
// ------------------------
function sniffSeparator(text) {
  // controlla solo la prima riga non vuota
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t"];
  let best = { sep: ",", count: -1 };
  for (const sep of candidates) {
    const count = firstLine.split(sep).length;
    if (count > best.count) best = { sep, count };
  }
  return best.sep;
}

function parseCsvFile(fp) {
  const text = readText(fp);
  const sep = sepArg === "auto" ? sniffSeparator(text) : (sepArg === "\\t" ? "\t" : sepArg);
  const res = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: sep,
    dynamicTyping: false,
  });
  if (res.errors?.length) {
    console.error(`CSV parse errors in ${fp}:`, res.errors.slice(0, 3));
  }
  const rows = (res.data || []).filter((r) => r && Object.keys(r).length > 0);
  return { rows, sep };
}

// ------------------------
// Normalizzazione colonne
// ------------------------
const ALIASES = {
  hold_s: [
    "holding_time_s", "hold_time_s", "holding_s", "hold_s", "pack_time_s", "packing_time_s",
    "t_holding_s", "t_hold_s", "holdingTime_s", "holdTime_s"
  ],
  weight_g: [
    "weight_g", "part_weight_g", "piece_weight_g", "partWeight_g", "pieceWeight_g",
    "peso_g", "peso", "grammi", "mass_g", "part_mass_g"
  ],
  cycle_s: [
    "cycle_time_s", "cycle_s", "cycleTime_s", "tempo_ciclo_s", "t_cycle_s"
  ],
  quality: [
    "ok", "pass", "result", "esito", "quality", "status"
  ],
  defects: [
    "defect", "defects", "difetto", "difetti", "scrap", "scarto", "reject", "rejects"
  ],
  material: ["material", "mat", "resin", "polymer", "materiale"],
  press: ["press", "machine", "press_id", "macchina", "pressa"],
  mold: ["mold", "mold_id", "stamp", "stampo", "tool"],
  job: ["job", "order", "commessa", "lot", "batch", "lote", "lotto"],
};

function normKey(k) {
  return String(k).trim().toLowerCase().replace(/\s+/g, "_");
}

function findColumn(headers, aliasList) {
  const hNorm = headers.map((h) => ({ raw: h, n: normKey(h) }));
  for (const a of aliasList) {
    const target = normKey(a);
    const hit = hNorm.find((x) => x.n === target);
    if (hit) return hit.raw;
  }
  // fallback: contiene
  for (const a of aliasList) {
    const target = normKey(a);
    const hit = hNorm.find((x) => x.n.includes(target));
    if (hit) return hit.raw;
  }
  return null;
}

function toNumber(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // supporta "12,34" europeo
  const cleaned = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function truthyOk(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (["1", "true", "ok", "pass", "good", "yes", "y"].includes(s)) return true;
  if (["0", "false", "ko", "fail", "bad", "no", "n"].includes(s)) return false;
  return null;
}

// ------------------------
// Aggregazione + plateau
// ------------------------
function mean(nums) {
  const a = nums.filter((x) => Number.isFinite(x));
  if (!a.length) return null;
  return a.reduce((p, c) => p + c, 0) / a.length;
}
function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function stdev(nums) {
  const a = nums.filter((x) => Number.isFinite(x));
  if (a.length < 2) return null;
  const m = mean(a);
  const v = mean(a.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function plateauRecommend(points, cfg) {
  // points: [{t, w, n, sd}]
  // cfg: {minFracMax, slopeThresh, k, epsToMax}
  const sorted = points.slice().sort((a, b) => a.t - b.t);
  if (sorted.length < 3) {
    return { recommended_s: sorted.at(-1)?.t ?? null, reason: "pochi_punti" };
  }
  const maxW = Math.max(...sorted.map((p) => p.w).filter(Number.isFinite));
  if (!Number.isFinite(maxW) || maxW <= 0) {
    return { recommended_s: null, reason: "peso_non_valido" };
  }

  const minFracMax = cfg.minFracMax ?? 0.995;      // 99.5% del max
  const epsToMax = cfg.epsToMax ?? 0.002;          // entro 0.2% dal max
  const slopeThresh = cfg.slopeThresh ?? 0.02;     // g/s
  const k = cfg.k ?? 2;                            // consecutivi

  // slope tra punti
  const slopes = [];
  for (let i = 1; i < sorted.length; i++) {
    const dt = sorted[i].t - sorted[i - 1].t;
    const dw = sorted[i].w - sorted[i - 1].w;
    slopes.push({ i, slope: dt > 0 ? (dw / dt) : Infinity });
  }

  // criterio 1: entro eps dal max e resta lì
  for (let i = 0; i < sorted.length; i++) {
    const frac = 1 - (maxW - sorted[i].w) / maxW; // w/maxW
    if (frac >= (1 - epsToMax)) {
      return { recommended_s: sorted[i].t, reason: `entro_${(epsToMax*100).toFixed(2)}%_dal_max` };
    }
  }

  // criterio 2: slope bassa per k segmenti consecutivi, ma già vicino al max
  for (let i = 1; i < sorted.length; i++) {
    const frac = sorted[i].w / maxW;
    if (frac < minFracMax) continue;

    let ok = true;
    for (let j = 0; j < k; j++) {
      const seg = slopes.find((x) => x.i === i + j);
      if (!seg) { ok = false; break; }
      if (!(seg.slope >= 0 && seg.slope < slopeThresh)) { ok = false; break; }
    }
    if (ok) {
      return { recommended_s: sorted[i].t, reason: `slope<${slopeThresh}_g/s_x${k}` };
    }
  }

  // fallback: punto col miglior compromesso (knee grezzo): massimizza (w - lambda*t)
  const lambda = cfg.lambda ?? (0.001 * maxW); // penalizza tempo
  let best = sorted[0];
  let bestScore = -Infinity;
  for (const p of sorted) {
    const score = p.w - lambda * p.t;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return { recommended_s: best.t, reason: "knee_score" };
}

function csvLine(obj, headers) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",;\n\t]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return headers.map((h) => esc(obj[h])).join(",");
}

// ------------------------
// Main
// ------------------------
const files = globLike(inArg);
if (!files.length) {
  console.error(`Nessun file trovato per: ${inArg}`);
  process.exit(1);
}

ensureDir(outDir);
ensureDir(path.join(outDir, "plots"));
ensureDir(path.join(outDir, "aggregates"));

const seriesCols = seriesColsArg
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allSummaries = [];

for (const fp of files) {
  const base = path.basename(fp);
  const { rows } = parseCsvFile(fp);
  if (!rows.length) continue;

  const headers = Object.keys(rows[0] ?? {});
  const colHold = holdColOverride || findColumn(headers, ALIASES.hold_s);
  const colWeight = weightColOverride || findColumn(headers, ALIASES.weight_g);
  const colCycle = cycleColOverride || findColumn(headers, ALIASES.cycle_s);
  const colQuality = findColumn(headers, ALIASES.quality);
  const colDefects = findColumn(headers, ALIASES.defects);

  // serie: se l'utente non passa --series, prova a costruirla da materiale/pressa/stampo/commessa
  const autoSeries = [
    findColumn(headers, ALIASES.material),
    findColumn(headers, ALIASES.press),
    findColumn(headers, ALIASES.mold),
    findColumn(headers, ALIASES.job),
  ].filter(Boolean);

  const usedSeriesCols = seriesCols.length ? seriesCols : autoSeries;

  if (debug) {
    console.log(`\nFile: ${base}`);
    console.log({ colHold, colWeight, colCycle, colQuality, colDefects, usedSeriesCols });
  }

  if (!colHold) {
    allSummaries.push({
      file: base,
      series: base,
      recommended_hold_s: null,
      reason: "manca_colonna_holding_time",
      points: 0,
    });
    continue;
  }

  // raggruppa per serie → holdTime
  const bySeries = new Map(); // key -> rows
  for (const r of rows) {
    const hold = toNumber(r[colHold]);
    if (!Number.isFinite(hold)) continue;

    const seriesKey = usedSeriesCols.length
      ? usedSeriesCols.map((c) => `${c}=${r[c] ?? ""}`).join("|")
      : `file=${base}`;

    const arr = bySeries.get(seriesKey) ?? [];
    arr.push({ ...r, __hold_s: hold });
    bySeries.set(seriesKey, arr);
  }

  for (const [seriesKey, sRows] of bySeries.entries()) {
    const byHold = new Map(); // hold -> {weights[], cycles[], okFlags[], defects[], scrapRates[]}
    for (const r of sRows) {
      const h = r.__hold_s;
      const bucket = byHold.get(h) ?? { weights: [], cycles: [], ok: [], defects: [], scrapRates: [] };
      if (colWeight) {
        const w = toNumber(r[colWeight]);
        if (Number.isFinite(w)) bucket.weights.push(w);
      }
      if (colCycle) {
        const c = toNumber(r[colCycle]);
        if (Number.isFinite(c)) bucket.cycles.push(c);
      }
      if (colQuality) {
        const ok = truthyOk(r[colQuality]);
        if (ok != null) bucket.ok.push(ok);
      }
      if (colDefects) {
        const d = toNumber(r[colDefects]);
        if (Number.isFinite(d)) bucket.defects.push(d);
      }
      // scrapRate from producedQty / scrapQty when available
      const produced = toNumber(r.producedQty ?? r.producedQty ?? r["producedQty"]);
      const scrap = toNumber(r.scrapQty ?? r.scrapQty ?? r["scrapQty"]);
      if (Number.isFinite(produced) && produced > 0 && Number.isFinite(scrap)) {
        bucket.scrapRates.push(scrap / produced);
      }
      byHold.set(h, bucket);
    }

    const points = Array.from(byHold.entries())
      .map(([t, b]) => {
        const wMean = mean(b.weights);
        const wSd = stdev(b.weights);
        const cMean = mean(b.cycles);
        const okRate = b.ok.length ? (b.ok.filter(Boolean).length / b.ok.length) : null;
        const dMean = mean(b.defects);
        const scrapRate = mean(b.scrapRates);
        return {
          hold_s: Number(t),
          weight_mean_g: wMean,
          weight_sd_g: wSd,
          n_weight: b.weights.length,
          cycle_mean_s: cMean,
          ok_rate: okRate,
          defects_mean: dMean,
          scrap_rate: scrapRate,
        };
      })
      .sort((a, b) => a.hold_s - b.hold_s);

    // Se non ho peso, prova “minimo hold con ok_rate==1 o difetti==0”
    let rec = { recommended_s: null, reason: "dati_insufficienti" };
    const hasWeight = points.some((p) => Number.isFinite(p.weight_mean_g));

    if (hasWeight) {
      const plateauPoints = points
        .filter((p) => Number.isFinite(p.weight_mean_g))
        .map((p) => ({ t: p.hold_s, w: p.weight_mean_g, n: p.n_weight, sd: p.weight_sd_g }));
      rec = plateauRecommend(plateauPoints, {
        minFracMax: 0.995,
        epsToMax: 0.002,
        slopeThresh: 0.02,
        k: 2,
      });
    } else {
      // quality-first
      const okFull = points.find((p) => p.ok_rate != null && p.ok_rate >= 1);
      if (okFull) rec = { recommended_s: okFull.hold_s, reason: "prima_serie_ok_100%" };
      else {
        const zeroDef = points.find((p) => p.defects_mean != null && p.defects_mean <= 0);
        if (zeroDef) rec = { recommended_s: zeroDef.hold_s, reason: "prima_serie_difetti_0" };
        else if (points.length) rec = { recommended_s: points.at(-1).hold_s, reason: "fallback_ultimo_punto" };
      }
    }

    const recommended = rec.recommended_s;

    // salva aggregate CSV per serie
    const safeSeries = seriesKey.replace(/[^\w\-+=.]/g, "_").slice(0, 120);
    const aggPath = path.join(outDir, "aggregates", `${path.basename(base, path.extname(base))}__${safeSeries}.csv`);
    const aggHeaders = ["hold_s", "weight_mean_g", "weight_sd_g", "n_weight", "cycle_mean_s", "ok_rate", "defects_mean", "scrap_rate"];
    const aggCsv =
      aggHeaders.join(",") +
      "\n" +
      points.map((p) => csvLine(p, aggHeaders)).join("\n") +
      "\n";
    writeText(aggPath, aggCsv);

    // grafico HTML (Plotly via CDN)
    const plotPath = path.join(outDir, "plots", `${path.basename(base, path.extname(base))}__${safeSeries}.html`);
    const xs = points.map((p) => p.hold_s);
    const ysW = points.map((p) => (Number.isFinite(p.weight_mean_g) ? p.weight_mean_g : null));
    const ysC = points.map((p) => (Number.isFinite(p.cycle_mean_s) ? p.cycle_mean_s : null));
    const ysS = points.map((p) => (Number.isFinite(p.scrap_rate) ? p.scrap_rate : null));

    const plotHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gate Freeze Study - ${base}</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body style="font-family: system-ui, sans-serif; margin: 16px;">
  <h2 style="margin: 0 0 8px;">${base}</h2>
  <div style="margin: 0 0 12px; color: #333;">
    <div><b>Serie:</b> ${seriesKey}</div>
    <div><b>Raccomandazione:</b> ${recommended ?? "N/A"} s (${rec.reason})</div>
  </div>
  <div id="chart" style="width: 100%; height: 520px;"></div>
  <script>
    const x = ${JSON.stringify(xs)};
    const yW = ${JSON.stringify(ysW)};
    const yC = ${JSON.stringify(ysC)};
    const recommended = ${recommended == null ? "null" : recommended};

    const traces = [];
    if (yW.some(v => v != null)) {
      traces.push({ x, y: yW, mode: "lines+markers", name: "Peso medio (g)" });
    }
    if (yC.some(v => v != null)) {
      traces.push({ x, y: yC, mode: "lines+markers", name: "Cycle time medio (s)", yaxis: "y2" });
    }
    if (yS && yS.some(v => v != null)) {
      traces.push({ x, y: yS, mode: "lines+markers", name: "Scrap rate", yaxis: "y2" });
    }

    const shapes = [];
    if (recommended != null) {
      shapes.push({
        type: "line",
        x0: recommended, x1: recommended,
        y0: 0, y1: 1,
        yref: "paper",
        line: { width: 2, dash: "dash" }
      });
    }

    const layout = {
      title: "Plateau vs Holding time",
      xaxis: { title: "Holding time (s)" },
      yaxis: { title: "Peso (g)" },
      yaxis2: { title: "Cycle time (s)", overlaying: "y", side: "right" },
      shapes
    };

    Plotly.newPlot("chart", traces, layout, {responsive: true});
  </script>
</body>
</html>`;
    writeText(plotPath, plotHtml);

    // try to extract recipe fingerprint from rows (if available)
    const fpVal = (sRows.find((r) => r[fingerprintCol]) || {})[fingerprintCol] ?? null;

    // compute a simple confidence score
    const pts = points.length;
    const baseScore = clamp(pts / 20, 0, 1);
    const reasonBonus = String(rec.reason || "").startsWith("entro_") ? 1 : 0.5;
    const confidence = clamp(0.6 * baseScore + 0.4 * reasonBonus, 0, 1);

    allSummaries.push({
      file: base,
      series: seriesKey,
      recommended_hold_s: recommended,
      reason: rec.reason,
      points: pts,
      confidence,
      recipeFingerprint: fpVal,
      has_weight: hasWeight,
      aggregate_csv: path.relative(process.cwd(), aggPath).replaceAll("\\", "/"),
      plot_html: path.relative(process.cwd(), plotPath).replaceAll("\\", "/"),
    });
  }
}

// summary outputs
const summaryJsonPath = path.join(outDir, "summary.json");
writeText(summaryJsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), summaries: allSummaries }, null, 2));

const summaryCsvPath = path.join(outDir, "summary.csv");
const summaryHeaders = ["file", "series", "recommended_hold_s", "reason", "points", "has_weight", "aggregate_csv", "plot_html"];
const summaryCsv =
  summaryHeaders.join(",") +
  "\n" +
  allSummaries.map((s) => csvLine(s, summaryHeaders)).join("\n") +
  "\n";
writeText(summaryCsvPath, summaryCsv);

// emit by fingerprint: aggregate best candidate per recipeFingerprint
if (emitByFingerprint) {
  const byFingerprint = new Map();
  for (const s of allSummaries) {
    if (s.recommended_hold_s == null) continue;
    const fp = s.recipeFingerprint ?? null;
    if (!fp) continue;
    const existing = byFingerprint.get(fp);
    if (!existing) {
      byFingerprint.set(fp, s);
      continue;
    }
    // prefer higher confidence, tie-breaker higher points
    if ((s.confidence ?? 0) > (existing.confidence ?? 0)) {
      byFingerprint.set(fp, s);
    } else if ((s.confidence ?? 0) === (existing.confidence ?? 0) && (s.points ?? 0) > (existing.points ?? 0)) {
      byFingerprint.set(fp, s);
    }
  }

  const outObj = { generatedAt: new Date().toISOString(), fingerprints: {} };
  for (const [fp, s] of byFingerprint.entries()) {
    // try to parse materialId and pressId from series (if present)
    const kvs = String(s.series || "").split("|").map((x) => x.split("=")).filter((a) => a.length === 2);
    const obj = Object.fromEntries(kvs.map(([k, v]) => [k, v]));
    outObj.fingerprints[fp] = {
      recommended_hold_s: s.recommended_hold_s,
      confidence: Number((s.confidence ?? 0).toFixed(3)),
      valid_for: { recipeFingerprint: fp, materialId: obj.materialId ?? null, pressId: obj.pressId ?? null },
      points: s.points ?? 0,
      reason: s.reason ?? null,
    };
  }

  const byFpPath = path.join(outDir, "recommended_by_recipeFingerprint.json");
  writeText(byFpPath, JSON.stringify(outObj, null, 2));
}

console.log(`OK. Output: ${outDir}`);
console.log(`- ${path.relative(process.cwd(), summaryJsonPath).replaceAll("\\", "/")}`);
console.log(`- ${path.relative(process.cwd(), summaryCsvPath).replaceAll("\\", "/")}`);
