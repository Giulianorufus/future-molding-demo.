import * as THREE from 'three'

export type FillArrivalField = {
  geometry: THREE.BufferGeometry
  minDistance: number
  maxDistance: number
}

/**
 * Builds a qualitative surface-arrival field from a selected gate.
 * Distances follow mesh edges (Dijkstra), so the front follows the part
 * surface instead of an arbitrary world axis. This is not a volumetric flow solver.
 */
export function buildSurfaceFillArrival(source: THREE.BufferGeometry, gateLocal: THREE.Vector3): FillArrivalField | null {
  const geometry = source.clone()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!position || position.count === 0) return null

  const index = geometry.getIndex()
  const neighbors: Array<Map<number, number>> = Array.from({ length: position.count }, () => new Map())
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

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()

  const link = (i: number, j: number) => {
    a.fromBufferAttribute(position, i)
    b.fromBufferAttribute(position, j)
    const w = a.distanceTo(b)
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

  let sourceVertex = 0
  let nearest = Infinity
  for (let i = 0; i < position.count; i++) {
    a.fromBufferAttribute(position, i)
    const d = a.distanceToSquared(gateLocal)
    if (d < nearest) { nearest = d; sourceVertex = i }
  }

  const dist = new Float64Array(position.count)
  dist.fill(Infinity)
  dist[sourceVertex] = 0
  const visited = new Uint8Array(position.count)

  // Binary min-heap [distance, vertex].
  const heap: Array<[number, number]> = [[0, sourceVertex]]
  const push = (item: [number, number]) => {
    heap.push(item)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = (): [number, number] | undefined => {
    if (!heap.length) return undefined
    const root = heap[0]
    const tail = heap.pop()!
    if (heap.length) {
      heap[0] = tail
      let i = 0
      for (;;) {
        let smallest = i
        const l = i * 2 + 1, r = l + 1
        if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l
        if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r
        if (smallest === i) break
        ;[heap[i], heap[smallest]] = [heap[smallest], heap[i]]
        i = smallest
      }
    }
    return root
  }

  while (heap.length) {
    const current = pop()!
    const [d, v] = current
    if (visited[v]) continue
    visited[v] = 1
    for (const [n, w] of neighbors[v]) {
      const nd = d + w
      if (nd < dist[n]) { dist[n] = nd; push([nd, n]) }
    }
  }

  let maxDistance = 0
  let reached = 0
  for (let i = 0; i < dist.length; i++) {
    if (!Number.isFinite(dist[i])) continue
    reached++
    maxDistance = Math.max(maxDistance, dist[i])
  }
  if (!(maxDistance > 0)) return null

  const arrival = new Float32Array(position.count)
  for (let i = 0; i < dist.length; i++) arrival[i] = Number.isFinite(dist[i]) ? dist[i] / maxDistance : 1
  geometry.setAttribute('fillArrival', new THREE.BufferAttribute(arrival, 1))
  geometry.userData.fillReachability = {
    reachedVertices: reached,
    totalVertices: position.count,
    reachedRatio: reached / position.count,
  }
  return { geometry, minDistance: 0, maxDistance }
}
