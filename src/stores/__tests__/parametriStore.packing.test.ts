import { useParametriStore } from '../../stores/parametriStore'

describe('parametriStore packing suggestion handling', () => {
  it('does not apply packing suggestion when provided packing-only rec', () => {
    const store: any = useParametriStore as any
    // reset store
    store.getState().reset()
    // prepare a dummy result without packingProfile
    const dummy = { tonnellaggioRequired: 1 }
    store.setState({ result: dummy, lastCalcResult: dummy })
    // packing-only rec (no gateFreeze recommended_hold_s)
    const packingRec = { packing: { recommended_holdingPressure_bar: 250, confidence: 0.4, points: 8 } }
    const applied = store.getState().applyGateFreezeIfEligible(packingRec as any)
    expect(applied).toBe(false)
  })
})
