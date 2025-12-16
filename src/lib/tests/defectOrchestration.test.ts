import { calculateInjection } from '../../services/calculationEngine'
import { getPressSpecs } from '../pressData'

describe('Defect orchestration (service-level)', () => {
  test('merges defect appliedCorrections from context into result', () => {
    const params = { spessore: 2, volumeCavita: 50, volumeMaterozza: 5, cushion: 5 }
    const marca = 'Generic'
    const modello = '250'
    const material = { id: 'mat1', density_g_cm3: 1.2, name: 'PLA' }

    const context: any = {
      defectId: 'flash',
      severity: 'high',
      appliedCorrections: [
        { field: 'packing.pressure', old: 30, new: 20, reason: 'defect:flash' }
      ]
    }

    const res = calculateInjection(params as any, marca as any, modello, material as any, context)
    expect(res).toBeTruthy()
    expect(Array.isArray(res.appliedCorrections)).toBe(true)
    const found = res.appliedCorrections.find((c: any) => c && c.reason === 'defect:flash')
    expect(found).toBeTruthy()
  })

  test('applies press limits (clamps injection speed)', () => {
    const params = { spessore: 2, volumeCavita: 10000, volumeMaterozza: 0, cushion: 5 }
    const marca = 'Generic'
    const modello = '250'
    const material = { id: 'mat1', density_g_cm3: 1.2, name: 'PLA' }

    const press = getPressSpecs(marca, modello)!
    expect(press).toBeTruthy()

    const res = calculateInjection(params as any, marca as any, modello, material as any, {})
    expect(res).toBeTruthy()
    // injectionSpeed must be clamped to press.maxInjectionSpeed_cm3s
    expect(res.injectionSpeed_cm3s).toBeLessThanOrEqual(press.maxInjectionSpeed_cm3s)
    // warning should mention clamped speed
    const hasClampWarning = (res.warnings || []).some((w: string) => String(w).includes('Clamped injectionSpeed_cm3s'))
    expect(hasClampWarning).toBe(true)
  })

  test('mitigates clamp overload by applying corrections when utilization critical', () => {
    const params = { spessore: 10, volumeCavita: 50000, volumeMaterozza: 0, cushion: 5 }
    const marca = 'Generic'
    const modello = '250'
    const material = { id: 'mat1', density_g_cm3: 1.2, name: 'PLA' }

    const context: any = { defectId: 'flash', severity: 'high' }
    const res = calculateInjection(params as any, marca as any, modello, material as any, context)
    expect(res).toBeTruthy()
    // mitigation should add appliedCorrections and warnings mentioning Auto-correction
    expect(Array.isArray(res.appliedCorrections)).toBe(true)
    const hasMitigation = (res.appliedCorrections || []).some((s: any) => String(s).includes('pack_bar') || String(s).includes('injectionPressure_bar'))
    expect(hasMitigation).toBe(true)
    const hasWarning = (res.warnings || []).some((w: string) => String(w).includes('Auto-correction') || String(w).includes('Auto-correction:'))
    expect(hasWarning).toBe(true)
  })
})
