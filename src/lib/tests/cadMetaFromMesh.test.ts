import { buildCadAnalysisMetaFromMesh } from "../cadMetaFromMesh"

describe('cadMetaFromMesh projected area stabilization', () => {
  it('uses hull area for projectedArea_cm2 when triangles duplicated', () => {
    // rectangle 100x50 on z=0 made of two triangles, duplicated
    const positions = [
      0,0,0,
      100,0,0,
      0,50,0,
      100,0,0,
      100,50,0,
      0,50,0,
    ]
    // duplicate triangles (same vertices repeated) to simulate overlapping
    const positionsDup = [...positions, ...positions]
    const meta = buildCadAnalysisMetaFromMesh({ positions: positionsDup, indices: undefined, bbox_mm: { x:100, y:50, z:2 } })
    // hull area should be 5000 mm2 => 50 cm2
    expect(meta.projectedAreaHull_cm2).toBeCloseTo(50, 3)
    // triangles area doubled but we use hull for projectedArea_cm2
    expect(meta.projectedAreaTriangles_cm2).toBeGreaterThan(meta.projectedAreaHull_cm2)
    expect(meta.projectedArea_cm2).toBeCloseTo(meta.projectedAreaHull_cm2)
  })
})
