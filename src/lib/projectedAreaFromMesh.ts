export type PositionsArray = Float32Array | number[]
export type IndicesArray = Uint32Array | number[]

function get2D(v: number[], axis: 'x' | 'y' | 'z', idx: number): [number, number] {
  const base = idx * 3
  const x = v[base]
  const y = v[base + 1]
  const z = v[base + 2]
  if (axis === 'x') return [y, z]
  if (axis === 'y') return [x, z]
  return [x, y]
}

export function projectedAreaFromMesh(positions: PositionsArray, indices?: IndicesArray, axis: 'x' | 'y' | 'z' = 'z') {
  const pos = Array.isArray(positions) ? positions : Array.from(positions)
  const idx = indices ? (Array.isArray(indices) ? indices : Array.from(indices)) : undefined

  const triangles: Array<[number, number, number]> = []
  if (idx && idx.length >= 3) {
    for (let i = 0; i + 2 < idx.length; i += 3) {
      triangles.push([idx[i], idx[i + 1], idx[i + 2]])
    }
  } else {
    const vertCount = Math.floor(pos.length / 3)
    for (let i = 0; i + 2 < vertCount; i += 3) {
      triangles.push([i, i + 1, i + 2])
    }
  }

  let area_mm2 = 0
  for (const tri of triangles) {
    const [i1, i2, i3] = tri
    const a = get2D(pos, axis, i1)
    const b = get2D(pos, axis, i2)
    const c = get2D(pos, axis, i3)
    const abx = b[0] - a[0]
    const aby = b[1] - a[1]
    const acx = c[0] - a[0]
    const acy = c[1] - a[1]
    const cross = Math.abs(abx * acy - aby * acx)
    area_mm2 += 0.5 * cross
  }

  // convert mm^2 to cm^2 (1 cm^2 = 100 mm^2)
  const area_cm2 = Math.round((area_mm2 / 100) * 100) / 100
  const reason = `mesh:${triangles.length}tris;axis=${axis}`
  return { projectedArea_cm2: area_cm2, reason }
}

export function estimateProjectedAreaFromBboxFallback(bbox: { x: number; y: number; z: number } | null | undefined, axis: 'x' | 'y' | 'z' = 'z') {
  if (!bbox) return { projectedArea_cm2: undefined as unknown as number, reason: 'no-bbox' }
  const dims = [bbox.x || 0, bbox.y || 0, bbox.z || 0]
  // choose the two dims perpendicular to axis
  let a = 0
  let b = 0
  if (axis === 'x') {
    a = dims[1]; b = dims[2]
  } else if (axis === 'y') {
    a = dims[0]; b = dims[2]
  } else {
    a = dims[0]; b = dims[1]
  }
  const area_mm2 = Math.max(0, a) * Math.max(0, b)
  const area_cm2 = Math.round((area_mm2 / 100) * 100) / 100
  return { projectedArea_cm2: area_cm2, reason: 'bbox-fallback' }
}
