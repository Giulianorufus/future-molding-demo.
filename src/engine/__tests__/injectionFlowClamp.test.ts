import { calcolaParametri } from '../../calcEngine'

describe('injection flow clamp', () => {
  test('caps injection flow by machine maxInjectionSpeed_cm3_s and emits warning', () => {
    const input: any = {
      machine: {
        id: 'arburg-50t',
        tonnellaggio_kN: 500,
        screwDiameter_mm: 20,
        // artificially low press max flow to force clamp
        maxInjectionSpeed_cm3_s: 10,
        maxInjectionPressure_bar: 100,
        maxShotVolume_cm3: 200,
      },
      material: { id: 'pc' },
      geometry: {
        // shot volume that will request non-trivial flow
        volumePezzo_cm3: 30,
        areaProiettata_cm2: 10,
      },
      // ensure deterministic behavior
      options: { debug: false },
    }

    const out: any = calcolaParametri(input)

    expect(out).toBeDefined()
    // suggestions/warnings must be present and contain clamp message
    expect(Array.isArray(out.suggerimenti)).toBe(true)
    const hasClampWarning = out.suggerimenti.some((s: string) =>
      /press.*maxInjectionFlow|maxInjectionFlow/i.test(s)
    )
    expect(hasClampWarning).toBe(true)

    // velIniezione (suggested injection speed) should not exceed machine cap
    if (typeof out.velIniezione === 'number') {
      expect(out.velIniezione).toBeLessThanOrEqual(input.machine.maxInjectionSpeed_cm3_s)
    }
  })
})
