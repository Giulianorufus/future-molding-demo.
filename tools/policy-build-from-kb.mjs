#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function round(n, d = 1) { return Math.round(n * 10**d) / 10**d }

function safeMean(arr) { if (!arr || !arr.length) return null; return arr.reduce((a,b)=>a+b,0)/arr.length }

function buildFromCases(cases) {
  const byFp = {}
  for (const c of cases) {
    if (!c.recipeFingerprint) continue
    const fp = c.recipeFingerprint
    byFp[fp] = byFp[fp] || { gateTimes: [], packingByPressure: {}, points: 0 }
    const rec = byFp[fp]
    if (typeof c.holdingTime_s === 'number') rec.gateTimes.push(c.holdingTime_s)
    if (typeof c.partWeight_g === 'number' && typeof c.holdingPressure_bar === 'number') {
      const p = String(c.holdingPressure_bar)
      rec.packingByPressure[p] = rec.packingByPressure[p] || []
      rec.packingByPressure[p].push(c.partWeight_g)
    }
    rec.points += 1
  }

  const fingerprints = {}
  for (const fp of Object.keys(byFp)) {
    const r = byFp[fp]
    // gateFreeze: average holding time
    const avgHold = safeMean(r.gateTimes)
    const gate = avgHold != null ? { recommended_hold_s: round(avgHold,1), confidence: Math.min(1, r.points/20), points: r.points } : null

    // packing: pick pressure with max mean weight, then choose first within 0.2% of max
    const pressures = Object.keys(r.packingByPressure)
    let packing = null
    if (pressures.length) {
      const means = pressures.map(p => ({ p: Number(p), mean: safeMean(r.packingByPressure[p]) }))
      const maxMean = Math.max(...means.map(m=>m.mean))
      // choose first pressure with mean within 0.2% of maxMean
      const chosen = means.sort((a,b)=>a.p-b.p).find(m => Math.abs(m.mean - maxMean) / maxMean <= 0.002)
      if (chosen) packing = { recommended_holdingPressure_bar: chosen.p, confidence: Math.min(1, r.points/20), points: r.points }
    }

    fingerprints[fp] = {}
    if (gate) fingerprints[fp].gateFreeze = gate
    if (packing) fingerprints[fp].packing = packing
  }

  return { generatedAt: new Date().toISOString(), fingerprints }
}

async function main() {
  const cwd = process.cwd()
  const argv = process.argv.slice(2)
  // optional flags: --kb <kbFile> --out <outFile>
  let kbFile = path.join(cwd, 'data', 'kb', 'cases.json')
  let outFile = path.join(cwd, 'public','policy','recommended_by_recipeFingerprint.json')
  const kbIndex = argv.indexOf('--kb')
  if (kbIndex !== -1 && argv[kbIndex+1]) kbFile = path.isAbsolute(argv[kbIndex+1]) ? argv[kbIndex+1] : path.resolve(cwd, argv[kbIndex+1])
  const outIndex = argv.indexOf('--out')
  if (outIndex !== -1 && argv[outIndex+1]) outFile = path.isAbsolute(argv[outIndex+1]) ? argv[outIndex+1] : path.resolve(cwd, argv[outIndex+1])

  if (!fs.existsSync(kbFile)) {
    console.error('KB cases not found:', kbFile)
    process.exit(2)
  }
  const raw = fs.readFileSync(kbFile, 'utf8')
  const cases = JSON.parse(raw || '[]')
  const policy = buildFromCases(cases)

  const outDir = path.dirname(outFile)
  try { fs.mkdirSync(outDir, { recursive: true }) } catch (_) {}
  fs.writeFileSync(outFile, JSON.stringify(policy, null, 2), 'utf8')
  console.log('Wrote policy to', outFile)
}

main().catch(e => { console.error(e); process.exit(1) })
