jest.mock('../../lib/clampForce', () => ({
  computeClampForce: jest.fn(() => ({ projectedArea_cm2: 140, clampForceRequired_kN: 720, clampPressureRequired_g_cm2: 0 })),
  estimateProjectedAreaFromBbox_mm: jest.fn(() => 140),
}))

// mock pressData early: export minimal PRESSES + getPressSpecs
jest.mock('../../lib/pressData', () => ({
  PRESSES: {},
  getPressSpecs: jest.fn(() => ({ clampForce_kN: 800 })),
}))

const { calculateInjection } = require('../../services/calculationEngine') as typeof import('../../services/calculationEngine')

describe('clamp guardrails', () => {
  const baseParams = { spessore: 2, volumeCavita: 10, volumeMaterozza: 0, cushion: 0 }

  test('utilization and >85 warning', () => {
    const res = calculateInjection(baseParams, 'Arburg', '320C', null, { cadAnalysisMeta: { projectedArea_cm2: 140, _projectedAreaReason: 'bbox-fallback', thickness_mm: 2, flowLength_mm: 10 } } as any)
    expect(res.clampForceRequired_kN).toBeCloseTo(720, 2)
    // with nominal 800 kN and usable 85% -> usable = 680 kN; utilization = 720/680 ~105.9%
    expect(res.clampForceAvailable_kN).toBeCloseTo(800, 1)
    expect(res.usableClampForce_kN).toBeCloseTo(680, 1)
    expect(res.clampUtilization_pct).toBeGreaterThan(100)
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/fuori finestra operativa|>100%/i)]))
  })

  test('>95 warning triggers', () => {
    // remock computeClampForce to return a higher required clamp (e.g. 770 kN -> 96.25% of 800)
    const mod = require('../../lib/clampForce')
    mod.computeClampForce.mockImplementation(() => ({ projectedArea_cm2: 140, clampForceRequired_kN: 820, clampPressureRequired_g_cm2: 0 }))

    // now required > available (820 > 800) -> impossibile fisicamente
    const res = calculateInjection(baseParams, 'Arburg', '320C', null, { cadAnalysisMeta: { projectedArea_cm2: 140, _projectedAreaReason: 'bbox-fallback', thickness_mm: 2, flowLength_mm: 10 } } as any)
    expect(res.clampUtilization_pct).toBeGreaterThan(100)
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/impossibile fisicamente|>100%/i)]))
  })

  test('assumptions and sources when bbox fallback', () => {
    const res = calculateInjection(baseParams, 'Arburg', '320C', null, { cadAnalysisMeta: { projectedArea_cm2: 140, _projectedAreaReason: 'bbox-fallback', thickness_mm: 2, flowLength_mm: 10 } } as any)
    expect(res.assumptions).toEqual(expect.arrayContaining(["Projected area from bbox fallback"]))
    expect(res.sources).toMatchObject({ projectedArea: 'bbox' })
  })
})
