import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'

describe('policy-publish integration (light)', () => {
  test('writes policy with rfpA from small CSV', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-pub-'))
    const kbFile = path.join(tmp, 'cases.json')
    const outFile = path.join(tmp, 'public', 'policy', 'recommended_by_recipeFingerprint.json')
    const csvPath = path.join(tmp, 'sample.csv')

    const csv = `recipeFingerprint,holdingTime_s,partWeight_g,holdingPressure_bar
rfpA,2.1,100,0.4
rfpA,2.1,100,0.4
`;
    fs.writeFileSync(csvPath, csv, 'utf8')

    const res = spawnSync(process.execPath, ['tools/policy-publish.mjs', '--in', csvPath, '--kb', kbFile, '--out', outFile], { cwd: process.cwd(), stdio: 'pipe' })
    if (res.error) throw res.error
    expect(res.status).toBe(0)

    expect(fs.existsSync(outFile)).toBe(true)
    const raw = fs.readFileSync(outFile, 'utf8')
    const obj = JSON.parse(raw)
    expect(obj).toHaveProperty('fingerprints')
    expect(obj.fingerprints).toHaveProperty('rfpA')
  })
})
