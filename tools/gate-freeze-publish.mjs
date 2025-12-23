#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  return argv[i + 1] ?? def;
};

const inArg = getArg("--in", "data/production/*.csv");
const outDir = getArg("--out", "out/gate-freeze");
const dest = getArg("--dest", "public/gate-freeze/recommended_by_recipeFingerprint.json");

const script = path.resolve("tools/gate-freeze-study.mjs");
const node = process.execPath;

console.log(`Running gate-freeze study (in=${inArg}) -> out=${outDir}`);
const res = spawnSync(node, [script, "--in", inArg, "--out", outDir, "--series", "recipeFingerprint,materialId,pressId"], {
  stdio: "inherit",
});

if (res.status !== 0) {
  console.error("ERRORE: lo script di analisi ha fallito");
  process.exit(res.status ?? 1);
}

const src = path.join(outDir, "recommended_by_recipeFingerprint.json");
if (!fs.existsSync(src)) {
  console.error(`ERRORE: file di output non trovato: ${src}`);
  process.exit(1);
}

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
} catch (e) {
  console.error(`ERRORE: impossibile copiare ${src} -> ${dest}:`, e?.message ?? e);
  process.exit(1);
}

console.log(`OK: published\n- ${src}\n-> ${dest}`);
