import { materialCatalog } from '@/data/materialCatalog'

describe('materialCatalog basic validation', () => {
  test('ids are unique', () => {
    const ids = materialCatalog.map(m => m.id)
    const set = new Set(ids)
    expect(set.size).toBe(ids.length)
  })

  test('default temperatures within min/max', () => {
    for (const m of materialCatalog) {
      expect(m.meltTempC.default).toBeGreaterThanOrEqual(m.meltTempC.min)
      expect(m.meltTempC.default).toBeLessThanOrEqual(m.meltTempC.max)

      expect(m.moldTempC.default).toBeGreaterThanOrEqual(m.moldTempC.min)
      expect(m.moldTempC.default).toBeLessThanOrEqual(m.moldTempC.max)
    }
  })

  test('shrink min <= max', () => {
    for (const m of materialCatalog) {
      expect(m.shrink.minPct).toBeLessThanOrEqual(m.shrink.maxPct)
    }
  })
})
