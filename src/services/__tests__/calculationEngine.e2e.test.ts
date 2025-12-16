import { jest } from '@jest/globals'

describe('calculateInjection end-to-end (clamp force propagation + warnings)', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('propagates clamp force and emits warning when required > press capacity', () => {
    // mock a small press capacity to force an overload
    jest.doMock('../../lib/pressData', () => {
      const actual: any = jest.requireActual('../../lib/pressData')
      // return real exports but override getPressSpecs to return a small clamp
      return Object.assign({}, actual, {
        getPressSpecs: (brand: string, model: string) => ({ ...(actual.PRESSES?.Generic?.[0] ?? {}), clampForce_kN: 100 }),
      })
    })

    const { calculateInjection } = require('../calculationEngine')

    // Use very large cavity volume to increase projected area heuristic
    const params = { spessore: 2, volumeCavita: 20000, volumeMaterozza: 0, cushion: 1 }
    const material = { id: 'M_TEST', density_g_cm3: 1.0, recommendedInjectionSpeed_cm3s: [10, 200] } as any

    const out = calculateInjection(params, 'AnyBrand', 'AnyModel', material)

    // sanity
    expect(out).toBeDefined()
    expect(out.success).toBe(true)

    // clamp fields should be present
    expect(typeof out.clampForceRequired_kN).toBe('number')
    expect(typeof out.clampForceAvailable_kN).toBe('number')

    // required should be greater than available (we mocked a tiny press)
    expect(out.clampForceRequired_kN).toBeGreaterThan(out.clampForceAvailable_kN)

    // and a clamp-related warning should be emitted
    const warnings = Array.isArray(out.warnings) ? out.warnings.join(' | ') : ''
    expect(warnings.length).toBeGreaterThan(0)
    expect(/Clamp|pressa|sottodimensionata|fuori finestra/i.test(warnings)).toBeTruthy()
  })
})
