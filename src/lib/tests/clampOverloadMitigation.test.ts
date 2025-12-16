import { mitigateClampOverload } from '../clampOverloadMitigation'

describe('clamp overload mitigation', () => {
  test('reduces pack and injection for high utilization and non-short_shot defect', () => {
    const res: any = { clampUtilization_pct: 98, pack_bar: 200, injectionPressure_bar: 1500 }
    const ctx = { defectId: 'flash', severity: 'medium' }
    const pressSpecs: any = { maxInjectionPressure_bar: 2000 }
    const out = mitigateClampOverload(res, ctx, pressSpecs)
    expect(out.appliedCorrections.length).toBeGreaterThan(0)
    expect(out.warningsAdded).toEqual(expect.arrayContaining([expect.stringMatching(/Auto-correction/)]))
    expect(out.result.pack_bar).toBeLessThan(200)
  })

  test('does not reduce when defect is short_shot', () => {
    const res: any = { clampUtilization_pct: 98, pack_bar: 200, injectionPressure_bar: 1500 }
    const ctx = { defectId: 'short_shot', severity: 'high' }
    const pressSpecs: any = { maxInjectionPressure_bar: 2000 }
    const out = mitigateClampOverload(res, ctx, pressSpecs)
    expect(out.appliedCorrections.length).toBe(0)
    expect(out.warningsAdded).toEqual(expect.arrayContaining([expect.stringMatching(/undersized/)]))
    expect(out.result.pack_bar).toBe(200)
  })
})
