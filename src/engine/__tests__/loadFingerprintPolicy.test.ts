import { getFingerprintPolicy } from '../policy/loadFingerprintPolicy'

describe('loadFingerprintPolicy', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('returns packing recommendation from unified policy', async () => {
    const mock = { generatedAt: 'x', fingerprints: { rfpA: { packing: { recommended_holdingPressure_bar: 250, confidence: 0.4, points: 8, reason: 'test' } } } }
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => mock })) as any
    const rec = await getFingerprintPolicy('rfpA')
    expect(rec).not.toBeNull()
    expect(rec?.packing?.recommended_holdingPressure_bar).toBe(250)
    expect(rec?.packing?.confidence).toBe(0.4)
    expect(rec?.packing?.points).toBe(8)
  })
})
