export type PositionsArray = Float32Array | number[]
export type IndicesArray = Uint32Array | number[]

function toArray(p: PositionsArray) {
  return Array.isArray(p) ? p : Array.from(p)
}

function cross(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
}

function dot(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  return ax * bx + ay * by + az * bz
}

export function computeSurfaceArea_mm2(positions: PositionsArray, indices?: IndicesArray) {
  const pos = toArray(positions)
  const idx = indices ? (Array.isArray(indices) ? indices : Array.from(indices)) : undefined
  let area = 0
  if (idx && idx.length >= 3) {
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const i1 = idx[i] * 3
      const i2 = idx[i + 1] * 3
      const i3 = idx[i + 2] * 3
      const ax = pos[i2] - pos[i1]
      const ay = pos[i2 + 1] - pos[i1 + 1]
      const az = pos[i2 + 2] - pos[i1 + 2]
      const bx = pos[i3] - pos[i1]
      const by = pos[i3 + 1] - pos[i1 + 1]
      const bz = pos[i3 + 2] - pos[i1 + 2]
      const cr = cross(ax, ay, az, bx, by, bz)
      const mag = Math.sqrt(cr[0] * cr[0] + cr[1] * cr[1] + cr[2] * cr[2])
      area += 0.5 * mag
    }
  } else {
    const vertCount = Math.floor(pos.length / 3)
    for (let i = 0; i + 2 < vertCount; i += 3) {
      const i1 = i * 3
      const i2 = (i + 1) * 3
      const i3 = (i + 2) * 3
      const ax = pos[i2] - pos[i1]
      const ay = pos[i2 + 1] - pos[i1 + 1]
      const az = pos[i2 + 2] - pos[i1 + 2]
      const bx = pos[i3] - pos[i1]
      const by = pos[i3 + 1] - pos[i1 + 1]
      const bz = pos[i3 + 2] - pos[i1 + 2]
      const cr = cross(ax, ay, az, bx, by, bz)
      const mag = Math.sqrt(cr[0] * cr[0] + cr[1] * cr[1] + cr[2] * cr[2])
      area += 0.5 * mag
    }
  }
  return area
}

export function computeSignedVolume_mm3(positions: PositionsArray, indices?: IndicesArray) {
  const pos = toArray(positions)
  const idx = indices ? (Array.isArray(indices) ? indices : Array.from(indices)) : undefined
  let vol = 0
  if (idx && idx.length >= 3) {
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const i1 = idx[i] * 3
      const i2 = idx[i + 1] * 3
      const i3 = idx[i + 2] * 3
      const v1x = pos[i1], v1y = pos[i1 + 1], v1z = pos[i1 + 2]
      const v2x = pos[i2], v2y = pos[i2 + 1], v2z = pos[i2 + 2]
      const v3x = pos[i3], v3y = pos[i3 + 1], v3z = pos[i3 + 2]
      const cr = cross(v2x - v1x, v2y - v1y, v2z - v1z, v3x - v1x, v3y - v1y, v3z - v1z)
      vol += dot(v1x, v1y, v1z, cr[0], cr[1], cr[2])
    }
  } else {
    const vertCount = Math.floor(pos.length / 3)
    for (let i = 0; i + 2 < vertCount; i += 3) {
      const i1 = i * 3
      const i2 = (i + 1) * 3
      const i3 = (i + 2) * 3
      const v1x = pos[i1], v1y = pos[i1 + 1], v1z = pos[i1 + 2]
      const v2x = pos[i2], v2y = pos[i2 + 1], v2z = pos[i2 + 2]
      const v3x = pos[i3], v3y = pos[i3 + 1], v3z = pos[i3 + 2]
      const cr = cross(v2x - v1x, v2y - v1y, v2z - v1z, v3x - v1x, v3y - v1y, v3z - v1z)
      vol += dot(v1x, v1y, v1z, cr[0], cr[1], cr[2])
    }
  }
  return vol / 6
}

function project2D(posArr: number[], axis: 'x' | 'y' | 'z') {
  const pts: Array<[number, number]> = []
  for (let i = 0; i + 2 < posArr.length; i += 3) {
    const x = posArr[i]
    const y = posArr[i + 1]
    const z = posArr[i + 2]
    if (axis === 'x') pts.push([y, z])
    else if (axis === 'y') pts.push([x, z])
    else pts.push([x, y])
  }
  return pts
}

function convexHull2D(points: Array<[number, number]>) {
  const pts = points.slice().sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0])
  if (pts.length <= 1) return pts
  const cross2 = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Array<[number, number]> = []
  for (const p of pts) {
    while (lower.length >= 2 && cross2(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Array<[number, number]> = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross2(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

function polygonArea(points: Array<[number, number]>) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i][0] * points[j][1] - points[j][0] * points[i][1]
  }
  return Math.abs(area) / 2
}

export function computeProjectedHullArea_mm2(positions: PositionsArray, axis: 'x' | 'y' | 'z' = 'z') {
  const pos = toArray(positions)
  const pts = project2D(pos, axis)
  const hull = convexHull2D(pts)
  return polygonArea(hull)
}

export function computeHullDiameter_mm(positions: PositionsArray, axis: 'x' | 'y' | 'z' = 'z') {
  const pos = toArray(positions)
  const pts = project2D(pos, axis)
  const hull = convexHull2D(pts)
  let maxd = 0
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      const dx = hull[i][0] - hull[j][0]
      const dy = hull[i][1] - hull[j][1]
      const d2 = dx * dx + dy * dy
      if (d2 > maxd) maxd = d2
    }
  }
  return Math.sqrt(maxd)
}

export function computeProjectedTrianglesArea_mm2(positions: PositionsArray, indices?: IndicesArray, axis: 'x' | 'y' | 'z' = 'z') {
  const pos = toArray(positions)
  const idx = indices ? (Array.isArray(indices) ? indices : Array.from(indices)) : undefined
  let area = 0
  if (idx && idx.length >= 3) {
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const i1 = idx[i] * 3
      const i2 = idx[i + 1] * 3
      const i3 = idx[i + 2] * 3
      const a = get2D(pos, axis, i1 / 3)
      const b = get2D(pos, axis, i2 / 3)
      const c = get2D(pos, axis, i3 / 3)
      const abx = b[0] - a[0]
      const aby = b[1] - a[1]
      const acx = c[0] - a[0]
      const acy = c[1] - a[1]
      const cross = Math.abs(abx * acy - aby * acx)
      area += 0.5 * cross
    }
  } else {
    const vertCount = Math.floor(pos.length / 3)
    for (let i = 0; i + 2 < vertCount; i += 3) {
      const a = get2D(pos, axis, i)
      const b = get2D(pos, axis, i + 1)
      const c = get2D(pos, axis, i + 2)
      const abx = b[0] - a[0]
      const aby = b[1] - a[1]
      const acx = c[0] - a[0]
      const acy = c[1] - a[1]
      const cross = Math.abs(abx * acy - aby * acx)
      area += 0.5 * cross
    }
  }
  return area
}

function get2D(posArr: number[], axis: 'x' | 'y' | 'z', idx: number): [number, number] {
  const base = idx * 3
  const x = posArr[base]
  const y = posArr[base + 1]
  const z = posArr[base + 2]
  if (axis === 'x') return [y, z]
  if (axis === 'y') return [x, z]
  return [x, y]
}
