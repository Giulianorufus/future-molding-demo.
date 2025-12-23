#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { in: null, out: 'out/holding-pressure' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--in' && args[i+1]) { out.in = args[++i]; continue; }
    if (a === '--out' && args[i+1]) { out.out = args[++i]; continue; }
  }
  if (!out.in) {
    console.error('Usage: node tools/holding-pressure-study.mjs --in "path/to/*.csv" [--out out/holding-pressure]');
    process.exit(2);
  }
  return out;
}

function expandSimpleGlob(pattern) {
  // support simple wildcard like dir/*.csv or *.csv
  if (!pattern.includes('*')) return [pattern];
  const dir = path.dirname(pattern);
  const base = path.basename(pattern);
  const re = new RegExp('^' + base.split('*').map(s => s.replace(/[.+?^${}()|[\\]\\]/g,'\\\\$&')).join('.*') + '$');
  const list = fs.readdirSync(dir === '.' ? process.cwd() : dir);
  return list.filter(f => re.test(f)).map(f => path.join(dir, f));
}

function detectDelimiter(firstLine) {
  if (firstLine.includes(';') && !firstLine.includes(',;')) return ';';
  return ',';
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]);
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g,''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map(c => c.trim().replace(/^"|"$/g,''));
    if (cols.length !== headers.length) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = cols[idx]);
    rows.push(obj);
  }
  return rows;
}

function toNum(v) {
  if (v === undefined || v === null || v === '') return NaN;
  return Number(String(v).replace(',', '.'));
}

function roundTo(x, dec=2) { return Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec); }

async function main() {
  const args = parseArgs();
  const inPatterns = Array.isArray(args.in) ? args.in : [args.in];
  const files = inPatterns.flatMap(p => expandSimpleGlob(p));
  if (!files.length) { console.error('No input files found for', args.in); process.exit(3); }

  const byFingerprint = new Map();

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    const rows = parseCSV(txt);
    for (const r of rows) {
      const fp = (r.recipeFingerprint || '').trim();
      if (!fp) continue;
      const pressure = toNum(r.holdingPressure_bar ?? r.packPressure_bar ?? r.holdingPressure);
      const weight = toNum(r.partWeight_g ?? r.partWeight ?? r.weight_g);
      if (Number.isNaN(pressure) || Number.isNaN(weight)) continue;
      const roundP = roundTo(pressure, 2);
      if (!byFingerprint.has(fp)) byFingerprint.set(fp, new Map());
      const m = byFingerprint.get(fp);
      if (!m.has(roundP)) m.set(roundP, { sum: 0, count: 0 });
      const bucket = m.get(roundP);
      bucket.sum += weight;
      bucket.count += 1;
    }
  }

  const out = { generatedAt: new Date().toISOString(), fingerprints: {} };

  for (const [fp, mapP] of byFingerprint.entries()) {
    // compute mean weight per pressure, sort ascending pressure
    const entries = Array.from(mapP.entries()).map(([p, stats]) => ({ pressure: Number(p), mean: stats.sum / stats.count, points: stats.count }));
    entries.sort((a,b) => a.pressure - b.pressure);
    if (!entries.length) continue;
    const maxMean = Math.max(...entries.map(e => e.mean));
    const threshold = maxMean * (1 - 0.002); // within 0.2%
    // find first pressure achieving >= threshold
    const candidate = entries.find(e => e.mean >= threshold);
    const points = entries.reduce((s,e) => s + e.points, 0);
    if (candidate) {
      const recommended = roundTo(candidate.pressure, 2);
      const confidence = Math.min(1, points / 20); // heuristic: more points -> higher confidence
      out.fingerprints[fp] = {
        packing: {
          recommended_holdingPressure_bar: recommended,
          confidence: roundTo(confidence, 2),
          points,
          reason: `within_0.2%_of_max_mean_weight_at_${recommended}bar`
        }
      };
    } else {
      out.fingerprints[fp] = { packing: null };
    }
  }

  // ensure out dir
  const outDir = args.out;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'recommended_by_recipeFingerprint.json');
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outFile);
}

main().catch(err => { console.error(err); process.exit(1); });
