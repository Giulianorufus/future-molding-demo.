import { normalizeCorrections, normalizeStringArray } from '../normalizeOutput'

describe('normalizeOutput', () => {
  it('dedupes and sorts string arrays', () => {
    const out = normalizeStringArray([' b ', 'a', 'a', '', 'B'])
    expect(out).toEqual(['B', 'a', 'b'].sort((x, y) => x.localeCompare(y)))
  })

  it('dedupes corrections by type+target and orders deterministically', () => {
    const out = normalizeCorrections([
      { type: 'clamp', target: 'packingPressure_bar', delta: -20 },
      { type: 'clamp', target: 'packingPressure_bar', delta: -10 }, // dup -> last wins
      { type: 'pressLimit', target: 'injectionSpeed_cm3_s', value: 120 },
      { type: 'pressLimit', target: 'injectionSpeed_cm3_s', value: 110 }, // dup -> last wins
    ]) as any[];

    expect(out.length).toBe(2)
    expect(out[0].type && out[1].type).toBeTruthy()

    // verifica “last wins”
    const clamp = out.find((c: any) => c.type === 'clamp' && c.target === 'packingPressure_bar')
    expect(clamp?.delta).toBe(-10)

    const speed = out.find((c: any) => c.type === 'pressLimit' && c.target === 'injectionSpeed_cm3_s')
    expect(speed?.value).toBe(110)

    // ordine stabile (per chiave)
    const keys = out.map((c: any) => `${(c.type ?? '').toLowerCase()}:${(c.target ?? '').toLowerCase()}`)
    const sorted = [...keys].sort((a, b) => a.localeCompare(b))
    expect(keys).toEqual(sorted)
  })
})
