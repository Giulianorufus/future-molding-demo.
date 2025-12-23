#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { appendCaseFromImport } from './appendCaseFromImport.mjs'

function detectDelimiter(text) {
  const first = text.split('\n')[0] || ''
  if (first.indexOf(';') !== -1) return ';'
  return ','
}

function parseCsv(text) {
  const delim = detectDelimiter(text)
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []
  const headers = lines[0].split(delim).map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim)
    const obj = {}
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (cols[j] || '').trim()
    }
    rows.push(obj)
  }
  return rows
}

function normalizeNumber(v) {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function rowToCase(row) {
  return {
    recipeFingerprint: row.recipeFingerprint ?? row.recipeFingerprint?.trim() ?? null,
    materialId: row.materialId ?? row.material ?? null,
    pressId: row.pressId ?? row.press ?? null,
    holdingTime_s: normalizeNumber(row.holdingTime_s ?? row.hold_s ?? row.holding_time_s),
    partWeight_g: normalizeNumber(row.partWeight_g ?? row.part_weight_g ?? row.weight_g),
    holdingPressure_bar: normalizeNumber(row.holdingPressure_bar ?? row.holding_pressure_bar ?? row.pressure_bar),
    producedQty: normalizeNumber(row.producedQty ?? row.produced_qty ?? row.qty),
    scrapQty: normalizeNumber(row.scrapQty ?? row.scrap_qty ?? row.scrap),
    defect: row.defect ?? row.defectId ?? null,
    timestampISO: new Date().toISOString()
  }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0) {
    console.error('Usage: append-cases-from-csv.mjs <csv-file> [--append-only]')
    process.exit(2)
  }
  const inFile = argv[0]
  const cwd = process.cwd()
  const inPath = path.isAbsolute(inFile) ? inFile : path.resolve(cwd, inFile)
  if (!fs.existsSync(inPath)) {
    console.error('Input file not found:', inPath)
    process.exit(2)
  }
  const txt = fs.readFileSync(inPath, 'utf8')
  const rows = parseCsv(txt)
  const cases = rows.map(rowToCase).filter(r => r.recipeFingerprint)

  const kbDir = path.resolve(cwd, 'data', 'kb')
  try { fs.mkdirSync(kbDir, { recursive: true }) } catch (_) {}
  const kbFile = path.join(kbDir, 'cases.json')
  let existing = []
  try { existing = JSON.parse(fs.readFileSync(kbFile, 'utf8') || '[]') } catch (_) { existing = [] }

  for (const c of cases) {
    appendCaseFromImport(c)
  }
  console.log('Appended', cases.length, 'cases to', kbFile)
}

main().catch(e => { console.error(e); process.exit(1) })
