import { projectedAreaFromMesh } from "../projectedAreaFromMesh"

describe('projectedAreaFromMesh', () => {
  it('computes 50 cm2 for a 100x50 rectangle on XY (axis z)', () => {
    // two triangles forming 100 x 50 rectangle on z=0 plane
    const positions = [
      0, 0, 0,
      100, 0, 0,
      0, 50, 0,
      100, 0, 0,
      100, 50, 0,
      0, 50, 0,
    ]
    const res = projectedAreaFromMesh(positions, undefined, 'z')
    expect(res.projectedArea_cm2).toBeCloseTo(50, 6)
  })

  it('is invariant to triangle vertex order', () => {
    const positionsA = [
      0, 0, 0,
      100, 0, 0,
      0, 50, 0,
    ]
    const positionsB = [
      0, 0, 0,
      0, 50, 0,
      100, 0, 0,
    ]
    const resA = projectedAreaFromMesh([...positionsA, ...positionsB], undefined, 'z')
    const resB = projectedAreaFromMesh([...positionsB, ...positionsA], undefined, 'z')
    expect(resA.projectedArea_cm2).toBeCloseTo(resB.projectedArea_cm2, 6)
  })
})
