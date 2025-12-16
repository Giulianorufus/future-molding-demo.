import { estimateThicknessFromBbox, estimateFlowLengthFromBbox } from "../cadMetaEstimate"

describe('cadMetaEstimate', () => {
  it('estimates thickness clamped and rounded', () => {
    const bbox = { x: 100, y: 50, z: 0.9 }
    const t = estimateThicknessFromBbox(bbox)
    expect(t).toBeGreaterThanOrEqual(0.6)
    expect(t).toBeLessThanOrEqual(8)
    expect(t).toBe(0.9)
  })

  it('estimates flow length as max dimension', () => {
    const bbox = { x: 120, y: 30, z: 5 }
    const L = estimateFlowLengthFromBbox(bbox)
    expect(L).toBe(120)
  })
})
