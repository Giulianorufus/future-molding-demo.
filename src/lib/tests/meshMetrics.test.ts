import { computeSurfaceArea_mm2, computeSignedVolume_mm3, computeProjectedHullArea_mm2, computeHullDiameter_mm } from "../meshMetrics"

describe('meshMetrics on box 100x50x2 mm', () => {
  // build box vertices
  const w = 100
  const h = 50
  const t = 2
  const verts = [
    0, 0, 0,
    w, 0, 0,
    w, h, 0,
    0, h, 0,
    0, 0, t,
    w, 0, t,
    w, h, t,
    0, h, t,
  ]
  const indices = [
    0,1,2, 0,2,3, // bottom
    4,6,5, 4,7,6, // top
    0,4,5, 0,5,1, // front
    1,5,6, 1,6,2, // right
    2,6,7, 2,7,3, // back
    3,7,4, 3,4,0, // left
  ]

  it('surface area ~10600 mm2', () => {
    const s = computeSurfaceArea_mm2(verts, indices)
    expect(s).toBeCloseTo(10600, -1) // tolerance
  })

  it('volume ~10000 mm3', () => {
    const v = computeSignedVolume_mm3(verts, indices)
    expect(Math.abs(v)).toBeGreaterThan(9000)
    expect(Math.abs(v)).toBeLessThan(11000)
  })

  it('projected hull area on Z ~5000 mm2 and hull diameter ~111.8 mm', () => {
    const a = computeProjectedHullArea_mm2(verts, 'z')
    expect(a).toBeCloseTo(5000, 0)
    const d = computeHullDiameter_mm(verts, 'z')
    expect(d).toBeCloseTo(Math.sqrt(w * w + h * h), 1)
  })

  it('projected triangles area doubles when duplicated, hull stays same', () => {
    const single = computeProjectedTrianglesArea_mm2(verts, indices, 'z')
    const dupVerts = [...verts, ...verts]
    const double = computeProjectedTrianglesArea_mm2(dupVerts, undefined, 'z')
    expect(double).toBeGreaterThan(single)
    const hull = computeProjectedHullArea_mm2(dupVerts, 'z')
    expect(hull).toBeCloseTo(5000, 0)
  })
})
