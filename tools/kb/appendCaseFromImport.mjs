import fs from 'fs'
import path from 'path'

function ensureKbDir(cwd) {
  const kbDir = path.join(cwd, 'data', 'kb')
  try { fs.mkdirSync(kbDir, { recursive: true }) } catch (_) {}
  return path.join(kbDir, 'cases.json')
}

export function appendCaseFromImport(caseObj) {
  const cwd = process.cwd()
  const kbFile = ensureKbDir(cwd)
  let existing = []
  try { existing = JSON.parse(fs.readFileSync(kbFile, 'utf8') || '[]') } catch (_) { existing = [] }
  existing.push(caseObj)
  fs.writeFileSync(kbFile, JSON.stringify(existing, null, 2), 'utf8')
  return true
}

export default appendCaseFromImport
