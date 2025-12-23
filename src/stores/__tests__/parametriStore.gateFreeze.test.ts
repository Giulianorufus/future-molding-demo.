import { useParametriStore } from '../../stores/parametriStore'

describe('parametriStore gate-freeze apply/revert', () => {
  beforeEach(() => {
    // reset store
    ;(useParametriStore as any).setState({ result: null, lastCalcResult: null, gateFreezeApplied: false, gateFreezeAppliedAtISO: null, gateFreezePreviousHold_s: null })
  })

  test('applies when confidence high and reverts', () => {
    const fakeResult: any = { some: 'value' }
    ;(useParametriStore as any).setState({ result: fakeResult, lastCalcResult: fakeResult })

    const rec = { recommended_hold_s: 2.1, confidence: 0.9, points: 20 }
    const applied = (useParametriStore as any).getState().applyGateFreezeIfEligible(rec)
    expect(applied).toBe(true)
    const st: any = (useParametriStore as any).getState()
    expect(st.gateFreezeApplied).toBe(true)
    expect(st.result).toBeDefined()
    expect(st.result.packingProfile).toBeDefined()
    const total = st.result.packingProfile.steps.reduce((a: number, b: any) => a + (Number(b.time_s) || 0), 0)
    // approximately equal to recommended 2.1
    expect(Math.abs(total - 2.1)).toBeLessThan(0.2)

    const reverted = (useParametriStore as any).getState().revertGateFreeze()
    expect(reverted).toBe(true)
    const st2: any = (useParametriStore as any).getState()
    expect(st2.gateFreezeApplied).toBe(false)
  })

  test('does not apply when confidence low', () => {
    const fakeResult: any = { some: 'value' }
    ;(useParametriStore as any).setState({ result: fakeResult, lastCalcResult: fakeResult })

    const rec = { recommended_hold_s: 2.1, confidence: 0.5, points: 20 }
    const applied = (useParametriStore as any).getState().applyGateFreezeIfEligible(rec)
    expect(applied).toBe(false)
    const st: any = (useParametriStore as any).getState()
    expect(st.gateFreezeApplied).toBeFalsy()
    expect(st.result?.packingProfile).toBeUndefined()
  })
})
