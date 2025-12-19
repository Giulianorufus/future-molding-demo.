import { calculateParameters } from '../calcEngine'

describe('calcEngine material effects + press limits', () => {
  it('applies material pressure multiplier before press limits and merges warnings in order', () => {
    const input: any = {
      machine: {
        id: 'test-press',
        tonnellaggio_kN: 500,
        screwDiameter_mm: 20,
        // low max pressure to force clamp
        maxInjectionSpeed_cm3_s: 200,
        maxInjectionPressure_bar: 60,
        maxShotVolume_cm3: 200,
      },
      material: {
        meltMin: 250,
        meltMax: 300,
        moldMin: 80,
        moldMax: 110,
        viscosity: 'medium',
        crystalline: false,
        family: 'PC',
        density_g_cm3: 1.2,
        // legacy attached effects to ensure multiplier + warnings are present
        _materialEffects: {
          multipliers: { pressure: 2.5, flow: 1.0 },
          warnings: ['MATERIAL_WARN'],
          assumptions: ['A1']
        }
      },
      geometry: {
        volumePezzo_cm3: 20,
        areaProiettata_cm2: 10,
      },
      options: { debug: false },
    }

    const out: any = calculateParameters(input)
    expect(out).toBeDefined()

    // 1) clamp applied: either present in appliedCorrections or visible as a clamp/limit warning
    const applied = out.appliedCorrections ?? []
    const appliedHasClamp = Array.isArray(applied) && applied.some((c: any) => {
      const s = String(c?.id ?? c?.type ?? c?.reason ?? '').toLowerCase()
      return /press|limit|clamp|injectionpressure/.test(s)
    })
    const warningsContainClamp = (out.warnings ?? []).some((s: any) => /limit|clamp|max|press.*max/i.test(String(s)))
    expect(appliedHasClamp || warningsContainClamp).toBe(true)

    // 2) warnings contain clamp and material
    const w = (out.warnings ?? []).map(String)
    const clampIdx = w.findIndex(s => /limit|clamp|max|press.*max/i.test(s))
    const matIdx = w.findIndex(s => /material|rinforzato|abrasion|usura|idrolisi|MATERIAL_WARN/i.test(s))

    expect(clampIdx).toBeGreaterThanOrEqual(0)
    expect(matIdx).toBeGreaterThanOrEqual(0)

    // 3) order: press-limit before material warning
    expect(clampIdx).toBeLessThan(matIdx)
  })
})
