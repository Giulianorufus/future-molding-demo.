#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { statSync } from 'fs';

function usage() {
  console.log('Usage: node tools/cad-smoke.mjs --in <file|dir> --out <dir> [--timeout-ms N]');
  process.exit(2);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { in: null, out: null, timeoutMs: 30000 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--in') out.in = args[++i];
    else if (a === '--out') out.out = args[++i];
    else if (a === '--timeout-ms') out.timeoutMs = Number(args[++i]);
    else usage();
  }
  if (!out.in || !out.out) usage();
  return out;
}

async function collectFiles(input) {
  const abs = path.resolve(input);
  const s = statSync(abs);
  const files = [];
  if (s.isFile()) return [abs];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else files.push(p);
    }
  }
  await walk(abs);
  return files;
}

function extOf(p) {
  return path.extname(p).replace(/^\./, '').toLowerCase();
}

async function run() {
  const args = parseArgs();
  const files = await collectFiles(args.in);
  await fs.mkdir(args.out, { recursive: true });

  const report = [];
  let hadError = false;
  let hadTimeout = false;

  // load occt factory
  let occtFactoryMod = null;
  try {
    occtFactoryMod = await import('occt-import-js');
  } catch (err) {
    console.error('Failed to import occt-import-js:', err.message || err);
    process.exit(1);
  }

  const factory = occtFactoryMod?.default ?? occtFactoryMod;
  if (typeof factory !== 'function') {
    console.error('occt-import-js does not export a factory function');
    process.exit(1);
  }

  console.log('Instantiating OCCT (this may take a while)');
  let occt = null;
  try {
    occt = await factory();
  } catch (err) {
    console.error('OCCT factory failed:', err.message || err);
    process.exit(1);
  }

  function pickFn(names) {
    for (const n of names) {
      if (typeof occt?.[n] === 'function') return occt[n].bind(occt);
    }
    return null;
  }

  for (const f of files) {
    const ext = extOf(f);
    const entry = { file: f, ext, status: 'unknown', duration_ms: 0, error: null };
    const start = Date.now();
    try {
      const buf = await fs.readFile(f);
      const data = buf instanceof Uint8Array ? buf : new Uint8Array(buf);

      let fn = null;
      if (ext === 'step' || ext === 'stp') {
        fn = pickFn(['readStepFile', 'ReadStepFile', 'readSTEPFile', 'readSTEP', 'ReadSTEP']);
      } else if (ext === 'iges' || ext === 'igs') {
        fn = pickFn(['readIgesFile', 'ReadIgesFile', 'readIGESFile', 'readIGES']);
      } else if (ext === 'stl') {
        fn = pickFn(['readStlFile', 'ReadStlFile', 'readSTLFile', 'ReadSTL']);
      } else {
        entry.status = 'skip';
        entry.error = 'unsupported ext';
        report.push(entry);
        continue;
      }

      if (!fn) {
        entry.status = 'error';
        entry.error = 'no reader in occt instance';
        hadError = true;
        report.push(entry);
        continue;
      }

      // run with timeout
      const p = (async () => {
        try {
          try {
            return await Promise.resolve(fn(data, null));
          } catch (e) {
            return await Promise.resolve(fn(data, path.basename(f)));
          }
        } catch (e) {
          throw e;
        }
      })();

      const res = await Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), args.timeoutMs)),
      ]);

      const dur = Date.now() - start;
      entry.duration_ms = dur;
      entry.status = 'ok';
      // try to extract meshes length if present
      try {
        const meshes = res?.meshes ?? (res?.mesh ? [res.mesh] : null);
        if (meshes) entry.meshes = Array.isArray(meshes) ? meshes.length : 1;
      } catch (_) {}

      report.push(entry);
    } catch (err) {
      const dur = Date.now() - start;
      entry.duration_ms = dur;
      const em = (err && err.message) ? err.message : String(err);
      entry.error = em;
      if (em === 'timeout') {
        entry.status = 'timeout';
        hadTimeout = true;
      } else {
        entry.status = 'error';
        hadError = true;
      }
      report.push(entry);
    }
  }

  const outJson = path.join(args.out, 'report.json');
  const outCsv = path.join(args.out, 'report.csv');
  await fs.writeFile(outJson, JSON.stringify(report, null, 2));
  const rows = ['file,ext,status,duration_ms,error,meshes'];
  for (const r of report) rows.push([r.file, r.ext, r.status, String(r.duration_ms), JSON.stringify(r.error), r.meshes ?? ''].join(','));
  await fs.writeFile(outCsv, rows.join('\n'));

  console.log('Wrote', outJson, outCsv);
  if (hadTimeout) process.exit(2);
  if (hadError) process.exit(1);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
