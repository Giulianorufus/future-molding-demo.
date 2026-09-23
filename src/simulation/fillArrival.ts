import * as THREE from 'three'
import type { InjectionGate } from '@/types/injectionGate'

export type FillArrivalField = {
  geometry: THREE.BufferGeometry
  minDistance: number
  /** Raw relative resistance index; not seconds or milliseconds. */
  maxRawArrival: number
  /** Backward-compatible alias for maxRawArrival. */
  maxDistance: number
  /** Dimensionless normalized spatial arrival field, also stored as fillArrival. */
  spatialFillArrival: Float32Array
  sourceGateIndex: Int32Array
  /** Dimensionless material resistance factor derived from canonical flowFactor. */
  viscosityFactor: number
  materialId?: string
  minLocalThickness: number
  maxLocalThickness: number
  avgLocalThickness: number
  measuredThicknessVertices: number
  estimatedThicknessVertices: number
  fallbackThicknessCount: number
  reachableVertices: number
  totalVertices: number
}

export type FillArrivalOptions = {
  thicknessAvgMm?: number | null
  maxMeasuredVertices?: number
  processContext?: FillProcessContext
}

export const FILL_GATE_TIE_EPSILON = 1e-9

export type FillProcessContext = {
  materialId?: string
  materialFlowFactor?: number
}

// Numerical safety bounds, not physical validity limits for CAD input.
export const FILL_THICKNESS_GUARD_MM = { min: 0.05, max: 100 }
const MIN_THICKNESS_FACTOR = 0.5
const MAX_THICKNESS_FACTOR = 3
const MIN_VISCOSITY_FACTOR = 0.25
const MAX_VISCOSITY_FACTOR = 4

function clampThickness(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0
    ? Math.max(FILL_THICKNESS_GUARD_MM.min, Math.min(FILL_THICKNESS_GUARD_MM.max, value))
    : fallback
}

export function computeThicknessFactor(avgThicknessMm: number, edgeThicknessMm: number): number {
  const average = clampThickness(avgThicknessMm, 2)
  const edge = clampThickness(edgeThicknessMm, average)
  return Math.max(MIN_THICKNESS_FACTOR, Math.min(MAX_THICKNESS_FACTOR, average / edge))
}

export function computeFlowCost(geometricDistance: number, avgThicknessMm: number, edgeThicknessMm: number): number {
  const distance = Number.isFinite(geometricDistance) && geometricDistance >= 0 ? geometricDistance : 0
  return distance * computeThicknessFactor(avgThicknessMm, edgeThicknessMm)
}

export function computeViscosityFactor(materialFlowFactor?: number): number {
  if (!Number.isFinite(materialFlowFactor) || !materialFlowFactor || materialFlowFactor <= 0) return 1
  return Math.max(MIN_VISCOSITY_FACTOR, Math.min(MAX_VISCOSITY_FACTOR, 1 / materialFlowFactor))
}

function fallbackThicknessFromMesh(geometry: THREE.BufferGeometry, fallback?: number | null): number {
  if (fallback && Number.isFinite(fallback) && fallback > 0) return clampThickness(fallback, 2)
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!position || position.count < 3) return 2
  const index = geometry.getIndex()
  let area = 0
  let signedVolume = 0
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const addTriangle = (ia: number, ib: number, ic: number) => {
    a.fromBufferAttribute(position, ia)
    b.fromBufferAttribute(position, ib)
    c.fromBufferAttribute(position, ic)
    area += b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5
    signedVolume += a.dot(b.clone().cross(c)) / 6
  }
  if (index) {
    for (let i = 0; i + 2 < index.count; i += 3) addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2))
  } else {
    for (let i = 0; i + 2 < position.count; i += 3) addTriangle(i, i + 1, i + 2)
  }
  if (area > 0 && Math.abs(signedVolume) > 0) return clampThickness((2 * Math.abs(signedVolume)) / area, 2)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const minDimension = box ? Math.min(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z) : 0
  return clampThickness(minDimension, 2)
}

function buildLocalThickness(geometry: THREE.BufferGeometry, options: FillArrivalOptions): { values: Float32Array; fallbackCount: number; measuredCount: number; source: string } {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const existing = geometry.getAttribute('localThickness') as THREE.BufferAttribute | undefined
  const fallback = fallbackThicknessFromMesh(geometry, options.thicknessAvgMm)
  if (existing && existing.count === position.count) {
    const values = new Float32Array(position.count)
    let fallbackCount = 0
    for (let i = 0; i < position.count; i++) {
      const value = existing.getX(i)
      if (Number.isFinite(value) && value > 0) values[i] = clampThickness(value, fallback)
      else { values[i] = fallback; fallbackCount++ }
    }
    return { values, fallbackCount, measuredCount: position.count - fallbackCount, source: 'provided-local' }
  }

  const values = new Float32Array(position.count)
  values.fill(fallback)
  const measuredByVertex = new Map<number, number>()
  const index = geometry.getIndex()
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3)
  const maxSamples = Math.max(1, Math.min(options.maxMeasuredVertices ?? 512, position.count))
  const step = Math.max(1, Math.ceil(triangleCount / maxSamples))
  const probe = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
  const raycaster = new THREE.Raycaster()
  const point = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const faceNormal = new THREE.Vector3()
  const edgeA = new THREE.Vector3()
  const edgeB = new THREE.Vector3()
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  const diagonal = bounds ? bounds.min.distanceTo(bounds.max) : 1
  const surfaceNudge = Math.max(1e-3, Math.min(0.25, diagonal * 1e-3))
  const direction = new THREE.Vector3()
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += step) {
    const offset = triangleIndex * 3
    const ia = index ? index.getX(offset) : offset
    const ib = index ? index.getX(offset + 1) : offset + 1
    const ic = index ? index.getX(offset + 2) : offset + 2
    point.fromBufferAttribute(position, ia)
    b.fromBufferAttribute(position, ib)
    c.fromBufferAttribute(position, ic)
    edgeA.copy(b).sub(point)
    edgeB.copy(c).sub(point)
    faceNormal.copy(edgeA).cross(edgeB).normalize()
    if (faceNormal.lengthSq() === 0) continue
    point.add(b).add(c).multiplyScalar(1 / 3)
    let best = Infinity
    for (const sign of [-1, 1]) {
      direction.copy(faceNormal).multiplyScalar(sign)
      // Offset and ray direction share the same sign: one of the two probes
      // starts just inside the shell and travels toward the opposite surface.
      raycaster.set(point.clone().addScaledVector(direction, surfaceNudge), direction)
      raycaster.near = 1e-3
      raycaster.far = FILL_THICKNESS_GUARD_MM.max
      const hit = raycaster.intersectObject(probe, false).find(item => item.distance > 1e-3)
      if (hit) best = Math.min(best, hit.distance)
    }
    if (Number.isFinite(best)) {
      const value = clampThickness(best, fallback)
      for (const vertexIndex of [ia, ib, ic]) {
        const previous = measuredByVertex.get(vertexIndex)
        if (previous === undefined || value < previous) measuredByVertex.set(vertexIndex, value)
      }
    }
  }
  ;(probe.material as THREE.Material).dispose()

  if (measuredByVertex.size) {
    const measured = Array.from(measuredByVertex, ([index, value]) => ({ index, value }))
    for (let i = 0; i < position.count; i++) {
      const direct = measuredByVertex.get(i)
      if (direct !== undefined) { values[i] = direct; continue }
      point.fromBufferAttribute(position, i)
      let nearest = measured[0]
      let nearestDistance = Infinity
      for (const sample of measured) {
        const samplePoint = new THREE.Vector3().fromBufferAttribute(position, sample.index)
        const distance = point.distanceToSquared(samplePoint)
        if (distance < nearestDistance) { nearest = sample; nearestDistance = distance }
      }
      values[i] = nearest.value
    }
    return { values, fallbackCount: 0, measuredCount: measured.length, source: 'normal-raycast+nearest-estimate' }
  }
  return { values, fallbackCount: position.count, measuredCount: 0, source: 'surface-volume-fallback' }
}

/**
 * Builds a qualitative surface-arrival field from a selected gate.
 * Distances follow mesh edges (Dijkstra), so the front follows the part
 * surface instead of an arbitrary world axis. This is not a volumetric flow solver.
 */
export function buildSurfaceFillArrival(source: THREE.BufferGeometry, gateLocal: THREE.Vector3 | InjectionGate[], options: FillArrivalOptions = {}): FillArrivalField | null {
  const geometry = source.clone()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!position || position.count === 0) return null
  const thickness = buildLocalThickness(geometry, options)
  const viscosityFactor = computeViscosityFactor(options.processContext?.materialFlowFactor)
  geometry.setAttribute('localThickness', new THREE.BufferAttribute(thickness.values, 1))
  const thicknessValues = thickness.values
  const averageThickness = Array.from(thicknessValues).reduce((sum, value) => sum + value, 0) / thicknessValues.length
  geometry.userData.fillThickness = {
    units: 'mm',
    source: thickness.source,
    minLocalThickness: Math.min(...thicknessValues),
    maxLocalThickness: Math.max(...thicknessValues),
    avgLocalThickness: averageThickness,
    viscosityFactor,
    measuredThicknessVertices: thickness.measuredCount,
    estimatedThicknessVertices: position.count - thickness.measuredCount - thickness.fallbackCount,
    fallbackThicknessCount: thickness.fallbackCount,
  }

  const index = geometry.getIndex()
  const neighbors: Array<Map<number, number>> = Array.from({ length: position.count }, () => new Map())
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  // STEP tessellation commonly duplicates vertices along face boundaries.
  // Weld coincident positions logically for graph traversal without altering render geometry.
  const epsilon = Math.max(1e-5, geometry.boundingSphere?.radius ? geometry.boundingSphere.radius * 1e-6 : 1e-5)
  const buckets = new Map<string, number[]>()
  const keyOf = (x: number, y: number, z: number) =>
    `${Math.round(x / epsilon)}|${Math.round(y / epsilon)}|${Math.round(z / epsilon)}`
  for (let i = 0; i < position.count; i++) {
    a.fromBufferAttribute(position, i)
    const key = keyOf(a.x, a.y, a.z)
    const bucket = buckets.get(key)
    if (bucket) bucket.push(i)
    else buckets.set(key, [i])
  }

  const link = (i: number, j: number) => {
    a.fromBufferAttribute(position, i)
    b.fromBufferAttribute(position, j)
    const geometricDistance = a.distanceTo(b)
    const edgeThickness = (thicknessValues[i] + thicknessValues[j]) * 0.5
    const thicknessFactor = computeThicknessFactor(averageThickness, edgeThickness)
    const flowCost = geometricDistance * thicknessFactor * viscosityFactor
    const w = flowCost
    const prev = neighbors[i].get(j)
    if (prev === undefined || w < prev) {
      neighbors[i].set(j, w)
      neighbors[j].set(i, w)
    }
  }

  const triangle = (ia: number, ib: number, ic: number) => {
    link(ia, ib); link(ib, ic); link(ic, ia)
  }

  // Zero-cost graph links join duplicated tessellation vertices at identical
  // positions, allowing the front to cross CAD face seams.
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue
    const root = bucket[0]
    for (let i = 1; i < bucket.length; i++) {
      neighbors[root].set(bucket[i], 0)
      neighbors[bucket[i]].set(root, 0)
    }
  }

  if (index) {
    for (let i = 0; i + 2 < index.count; i += 3) triangle(index.getX(i), index.getX(i + 1), index.getX(i + 2))
  } else {
    for (let i = 0; i + 2 < position.count; i += 3) triangle(i, i + 1, i + 2)
  }

  const rawGates = gateLocal instanceof THREE.Vector3
    ? [{ position: gateLocal, gateIndex: 0 }]
    : gateLocal.map((gate, gateIndex) => ({ position: new THREE.Vector3(gate.position.x, gate.position.y, gate.position.z), gateIndex }))
  const gates: Array<{ index: number; gateIndex: number }> = []
  for (const gate of rawGates) {
    if (![gate.position.x, gate.position.y, gate.position.z].every(Number.isFinite)) continue
    let sourceVertex = 0
    let nearest = Infinity
    for (let i = 0; i < position.count; i++) {
      a.fromBufferAttribute(position, i)
      const d = a.distanceToSquared(gate.position)
      if (d < nearest || (Math.abs(d - nearest) <= FILL_GATE_TIE_EPSILON && i < sourceVertex)) { nearest = d; sourceVertex = i }
    }
    const duplicate = gates.find((item) => item.index === sourceVertex)
    if (duplicate) {
      duplicate.gateIndex = Math.min(duplicate.gateIndex, gate.gateIndex)
    } else gates.push({ index: sourceVertex, gateIndex: gate.gateIndex })
  }
  if (!gates.length) return null

  const dist = new Float64Array(position.count)
  dist.fill(Infinity)
  const sourceGateIndex = new Int32Array(position.count)
  sourceGateIndex.fill(-1)

  // Binary min-heap [distance, vertex, source gate index].
  const heap: Array<[number, number, number]> = []
  const precedes = (a: [number, number, number], b: [number, number, number]) =>
    a[0] < b[0] || (a[0] === b[0] && (a[2] < b[2] || (a[2] === b[2] && a[1] < b[1])))
  const push = (item: [number, number, number]) => {
    heap.push(item)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!precedes(heap[i], heap[p])) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = (): [number, number, number] | undefined => {
    if (!heap.length) return undefined
    const root = heap[0]
    const tail = heap.pop()!
    if (heap.length) {
      heap[0] = tail
      let i = 0
      for (;;) {
        let smallest = i
        const l = i * 2 + 1, r = l + 1
        if (l < heap.length && precedes(heap[l], heap[smallest])) smallest = l
        if (r < heap.length && precedes(heap[r], heap[smallest])) smallest = r
        if (smallest === i) break
        ;[heap[i], heap[smallest]] = [heap[smallest], heap[i]]
        i = smallest
      }
    }
    return root
  }

  for (const gate of gates) {
    dist[gate.index] = 0
    sourceGateIndex[gate.index] = gate.gateIndex
    push([0, gate.index, gate.gateIndex])
  }

  while (heap.length) {
    const current = pop()!
    const [d, v, source] = current
    if (d !== dist[v] || source !== sourceGateIndex[v]) continue
    for (const [n, w] of neighbors[v]) {
      const nd = d + w
      const betterDistance = nd < dist[n] - FILL_GATE_TIE_EPSILON
      const sameDistanceBetterGate = Math.abs(nd - dist[n]) <= FILL_GATE_TIE_EPSILON && (sourceGateIndex[n] < 0 || source < sourceGateIndex[n])
      if (betterDistance || sameDistanceBetterGate) {
        dist[n] = nd
        sourceGateIndex[n] = source
        push([nd, n, source])
      }
    }
  }

  let maxDistance = 0
  let reached = 0
  for (let i = 0; i < dist.length; i++) {
    if (!Number.isFinite(dist[i])) continue
    reached++
    maxDistance = Math.max(maxDistance, dist[i])
  }
  const arrival = new Float32Array(position.count)
  for (let i = 0; i < dist.length; i++) arrival[i] = Number.isFinite(dist[i]) ? (maxDistance > 0 ? dist[i] / maxDistance : 0) : 1
  geometry.setAttribute('fillArrival', new THREE.BufferAttribute(arrival, 1))
  geometry.userData.fillReachability = {
    reachedVertices: reached,
    totalVertices: position.count,
    reachedRatio: reached / position.count,
  }
  return {
    geometry,
    minDistance: 0,
    maxRawArrival: maxDistance,
    maxDistance,
    spatialFillArrival: arrival,
    sourceGateIndex,
    viscosityFactor,
    materialId: options.processContext?.materialId,
    minLocalThickness: Math.min(...thicknessValues),
    maxLocalThickness: Math.max(...thicknessValues),
    avgLocalThickness: averageThickness,
    fallbackThicknessCount: thickness.fallbackCount,
    measuredThicknessVertices: thickness.measuredCount,
    estimatedThicknessVertices: position.count - thickness.measuredCount - thickness.fallbackCount,
    reachableVertices: reached,
    totalVertices: position.count,
  }
}
