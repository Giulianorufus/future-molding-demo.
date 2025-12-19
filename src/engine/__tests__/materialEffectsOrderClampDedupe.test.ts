import { calculateParameters } from '../calcEngine'

describe('materialEffects order: multipliers -> clamp -> dedupe', () => {
  test('applies flow multiplier before press clamp', () => {
    const input: any = {
      machine: {
        id: 'test-press',
        tonnellaggio_kN: 500,
        screwDiameter_mm: 20,
        maxInjectionSpeed_cm3_s: 10, // low cap to force clamp
        maxInjectionPressure_bar: 100,
        maxShotVolume_cm3: 200,
      },
      material: {
        meltMin: 200,
        meltMax: 240,
        moldMin: 40,
        moldMax: 80,
        viscosity: 'medium',
        crystalline: false,
        family: 'PCABS',
        density_g_cm3: 1.2,
        // materialEffects attached by adapter: large flow multiplier
        _materialEffects: {
          multipliers: { flow: 5 },
          warnings: ['material note'],
          assumptions: ['assume X']
        }
      },
      geometry: {
        volumePezzo_cm3: 30,
        areaProiettata_cm2: 10,
      },
      options: { debug: false },
    }

    const out: any = calculateParameters(input)
    expect(out).toBeDefined()
    // should have clamp warning because multiplier pushed required flow over cap
    expect(Array.isArray(out.suggerimenti)).toBe(true)
    const hasClamp = out.suggerimenti.some((s: string) => /maxInjectionFlow|Limited by press maxInjectionFlow|press.*maxInjectionFlow/i.test(s))
    expect(hasClamp).toBe(true)
    // velIniezione should not exceed machine cap
    if (typeof out.velIniezione === 'number') {
      expect(out.velIniezione).toBeLessThanOrEqual(input.machine.maxInjectionSpeed_cm3_s)
    }
  })

  test('deduplicates material warnings and assumptions after clamp', () => {
    const input: any = {
      machine: {
        id: 'test-press',
        tonnellaggio_kN: 500,
        screwDiameter_mm: 20,
        maxInjectionSpeed_cm3_s: 100,
        maxInjectionPressure_bar: 100,
        maxShotVolume_cm3: 200,
      },
      material: {
        meltMin: 200,
        meltMax: 240,
        moldMin: 40,
        moldMax: 80,
        viscosity: 'medium',
        crystalline: false,
        family: 'PCABS',
        density_g_cm3: 1.2,
        _materialEffects: {
          multipliers: { flow: 1 },
          warnings: ['W1', 'W2', 'W1'],
          assumptions: ['W2', 'A1']
        }
      },
      geometry: {
        volumePezzo_cm3: 10,
        areaProiettata_cm2: 5,
      },
      options: { debug: false },
    }

    const out: any = calculateParameters(input)
    expect(out).toBeDefined()
    const warningsArr = out.warnings || []
    const unique = Array.from(new Set(warningsArr))
    expect(warningsArr.length).toBe(unique.length)
    // ensure W1, W2, A1 are present in merged warnings (deduped)
    expect(unique.includes('W1')).toBe(true)
    expect(unique.includes('W2')).toBe(true)
    expect(unique.includes('A1')).toBe(true)
  })
})
