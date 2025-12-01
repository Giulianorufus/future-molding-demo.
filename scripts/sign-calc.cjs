#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const srcPath = path.resolve(__dirname, '../src/engine/calcEngine.ts');
  const outDir = path.resolve(__dirname, '../dist');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (_) {}

  if (!fs.existsSync(srcPath)) {
    console.error('calcEngine source not found:', srcPath);
    process.exit(1);
  }
  const src = fs.readFileSync(srcPath, 'utf8');
  const hash = crypto.createHash('sha256').update(src).digest('hex');
  fs.writeFileSync(path.join(outDir, 'calc.hash'), hash, 'utf8');
  console.log('Wrote dist/calc.hash', hash);

  // Try to minify if terser is available
  try {
    const terser = require('terser');
    const min = terser.minify(src, { module: true });
    if (min.code) {
      fs.writeFileSync(path.join(outDir, 'calcEngine.min.js'), min.code, 'utf8');
      console.log('Wrote dist/calcEngine.min.js');
    }
  } catch (e) {
    console.warn('terser not found or minify failed — skipping minification');
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
