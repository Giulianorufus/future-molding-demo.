import { applyPressLimits } from '../pressLimits'

describe('applyPressLimits', () => {
  test('clamps when over limits', () => {
    const res: any = {
      injectionPressure_bar: 3000,
      pack_bar: 2500,
      injectionSpeed_cm3s: 1000,
      vp_cm3: 1200,
    }
    const pressSpecs: any = {
      maxInjectionPressure_bar: 2000,
      maxInjectionSpeed_cm3s: 500,
      maxShot_cm3: 800,
    }

    const out = applyPressLimits(res, pressSpecs)
    expect(out.resultClamped.injectionPressure_bar).toBe(2000)
    expect(out.resultClamped.pack_bar).toBe(2000)
    expect(out.resultClamped.injectionSpeed_cm3s).toBe(500)
    expect(out.resultClamped.vp_cm3).toBe(800)
    expect(out.warningsAdded.length).toBeGreaterThanOrEqual(1)
    expect(out.clampedFields).toEqual(expect.arrayContaining(['injectionPressure_bar','pack_bar','injectionSpeed_cm3s','vp_cm3']))
  })

  test('no-op when within limits', () => {
    const res: any = { injectionPressure_bar: 1000, pack_bar: 500, injectionSpeed_cm3s: 200, vp_cm3: 300 }
    const pressSpecs: any = { maxInjectionPressure_bar: 2000, maxInjectionSpeed_cm3s: 500, maxShot_cm3: 800 }
    const out = applyPressLimits(res, pressSpecs)
    expect(out.warningsAdded).toHaveLength(0)
    expect(out.clampedFields).toHaveLength(0)
    expect(out.resultClamped.injectionPressure_bar).toBe(1000)
  })
})
