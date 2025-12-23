#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

function exitErr(msg, code = 1) {
  console.error('[policy:publish] ERROR:', msg);
  process.exit(code);
}

function log(...args) {
  console.log('[policy:publish]', ...args);
}

const args = process.argv.slice(2);
let inPattern;
let kbPathArg;
let outPathArg;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--in' && args[i+1]) { inPattern = args[i+1]; i++; }
  if (args[i] === '--kb' && args[i+1]) { kbPathArg = args[i+1]; i++; }
  if (args[i] === '--out' && args[i+1]) { outPathArg = args[i+1]; i++; }
}

const repoRoot = process.cwd();
const kbPath = kbPathArg ? (path.isAbsolute(kbPathArg) ? kbPathArg : path.join(repoRoot, kbPathArg)) : path.join(repoRoot, 'data', 'kb', 'cases.json');
const outPolicyPath = outPathArg ? (path.isAbsolute(outPathArg) ? outPathArg : path.join(repoRoot, outPathArg)) : path.join(repoRoot, 'public', 'policy', 'recommended_by_recipeFingerprint.json');

// Read initial KB count
let beforeCount = 0;
try {
  const raw = fs.readFileSync(kbPath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  beforeCount = Array.isArray(arr) ? arr.length : 0;
} catch (e) {
  // If KB does not exist, treat as empty
  beforeCount = 0;
}

if (inPattern) {
  const matches = glob.sync(inPattern, { nodir: true });
  if (!matches || matches.length === 0) {
    exitErr(`No files matched pattern: ${inPattern}`);
  }

  log(`Found ${matches.length} file(s) for append.`);
  for (const f of matches) {
    log('Appending from', f);
    const args = ['tools/kb/append-cases-from-csv.mjs', f]
    if (kbPath) args.push('--kb', kbPath)
    const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (res.error) {
      exitErr(`append-cases-from-csv failed for ${f}: ${res.error.message}`);
    }
    if (res.status !== 0) {
      exitErr(`append-cases-from-csv exited with code ${res.status} for ${f}`);
    }
  }
}

// Build policy from KB
log('Building policy from KB...');
const buildArgs = ['tools/policy-build-from-kb.mjs']
if (kbPath) buildArgs.push('--kb', kbPath)
if (outPolicyPath) buildArgs.push('--out', outPolicyPath)
const buildRes = spawnSync(process.execPath, buildArgs, { stdio: 'inherit' });
if (buildRes.error) {
  exitErr(`policy-build-from-kb failed: ${buildRes.error.message}`);
}
if (buildRes.status !== 0) {
  exitErr(`policy-build-from-kb exited with code ${buildRes.status}`);
}

// Read final KB count
let afterCount = 0;
try {
  const raw = fs.readFileSync(kbPath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  afterCount = Array.isArray(arr) ? arr.length : 0;
} catch (e) {
  afterCount = beforeCount;
}

// Read policy output
let policy;
try {
  const raw = fs.readFileSync(outPolicyPath, 'utf8');
  policy = JSON.parse(raw || '{}');
} catch (e) {
  exitErr(`Failed to read output policy at ${outPolicyPath}`);
}

const fingerprints = policy && policy.fingerprints ? Object.keys(policy.fingerprints) : [];

if (!fingerprints || fingerprints.length === 0) {
  exitErr('Policy is empty (no fingerprints). Aborting.');
}

log(`Cases before: ${beforeCount}, after: ${afterCount}, added: ${afterCount - beforeCount}`);
log(`Fingerprints in policy: ${fingerprints.length}`);
log(`Policy written to: ${outPolicyPath}`);

process.exit(0);
