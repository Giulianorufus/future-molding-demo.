#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null
    const t = fs.readFileSync(p, 'utf8')
    return JSON.parse(t)
  } catch (e) { return null }
}

const outDir = path.join(process.cwd(), 'public', 'policy')
fs.mkdirSync(outDir, { recursive: true })

const gf = readJson(path.join(process.cwd(), 'out', 'gate-freeze', 'recommended_by_recipeFingerprint.json'))
const hp = readJson(path.join(process.cwd(), 'out', 'holding-pressure', 'recommended_by_recipeFingerprint.json'))

const merged = { generatedAt: new Date().toISOString(), fingerprints: {} }

function mergeInto(src, key) {
  if (!src || !src.fingerprints) return
  for (const [fp, rec] of Object.entries(src.fingerprints)) {
    if (!merged.fingerprints[fp]) merged.fingerprints[fp] = {}
    if (key === 'gateFreeze') merged.fingerprints[fp].gateFreeze = rec
    if (key === 'packing') merged.fingerprints[fp].packing = rec?.packing ?? rec
    // preserve valid_for if present
    if (rec && rec.valid_for) merged.fingerprints[fp].valid_for = rec.valid_for
  }
}

mergeInto(gf, 'gateFreeze')
mergeInto(hp, 'packing')

const outFile = path.join(outDir, 'recommended_by_recipeFingerprint.json')
fs.writeFileSync(outFile, JSON.stringify(merged, null, 2), 'utf8')
console.log('Wrote', outFile)
