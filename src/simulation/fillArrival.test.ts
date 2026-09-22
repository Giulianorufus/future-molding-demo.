import * as THREE from 'three'
import {
  buildSurfaceFillArrival,
  computeFlowCost,
  computeThicknessFactor,
} from './fillArrival'

function makeIndexedPlane(thickness?: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    10, 0, 0,
    10, 10, 0,
    0, 10, 0,
  ], 3))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  if (thickness) geometry.setAttribute('localThickness', new THREE.Float32BufferAttribute(thickness, 1))
  return geometry
}

function buildBoxFill(thicknessMm: number) {
  const geometry = new THREE.BoxGeometry(20, 20, thicknessMm)
  return buildSurfaceFillArrival(geometry, new THREE.Vector3(0, 0, thicknessMm / 2), { maxMeasuredVertices: 64 })
}

describe('surface fill arrival thickness model', () => {
  test('uniform local thickness keeps propagation coherent', () => {
    const field = buildSurfaceFillArrival(makeIndexedPlane([2, 2, 2, 2]), new THREE.Vector3(0, 0, 0))

    expect(field).not.toBeNull()
    expect(field?.minLocalThickness).toBe(2)
    expect(field?.maxLocalThickness).toBe(2)
    expect(field?.avgLocalThickness).toBe(2)
    expect(field?.fallbackThicknessCount).toBe(0)
    expect(field?.reachableVertices).toBe(4)
    expect(field?.totalVertices).toBe(4)
    expect(Array.from(field!.geometry.getAttribute('fillArrival').array as Float32Array).every(Number.isFinite)).toBe(true)
  })

  test('thin path has higher resistance than a comparable thick path', () => {
    expect(computeThicknessFactor(2, 1)).toBeGreaterThan(computeThicknessFactor(2, 4))
    expect(computeFlowCost(10, 2, 1)).toBeGreaterThan(computeFlowCost(10, 2, 4))
  })

  test('fallback thickness is finite and explicitly reported', () => {
    const field = buildSurfaceFillArrival(makeIndexedPlane(), new THREE.Vector3(0, 0, 0))

    expect(field).not.toBeNull()
    expect(field?.fallbackThicknessCount).toBe(4)
    expect(field?.minLocalThickness).toBeGreaterThanOrEqual(0.6)
    expect(field?.maxLocalThickness).toBeLessThanOrEqual(8)
    expect(field?.geometry.userData.fillThickness.source).toBe('surface-volume-fallback')
    expect(Array.from(field!.geometry.getAttribute('localThickness').array as Float32Array).every(Number.isFinite)).toBe(true)
  })

  test('raycast measures a known 2 mm closed box without a preset attribute', () => {
    const field = buildBoxFill(2)

    expect(field).not.toBeNull()
    expect(field?.measuredThicknessVertices).toBeGreaterThan(0)
    expect(field?.minLocalThickness).toBeCloseTo(2, 1)
    expect(field?.geometry.getAttribute('localThickness')).toBeDefined()
  })

  test('raycast distinguishes 2 mm and 4 mm closed boxes', () => {
    const thin = buildBoxFill(2)
    const thick = buildBoxFill(4)

    expect(thin?.minLocalThickness).toBeCloseTo(2, 1)
    expect(thick?.minLocalThickness).toBeCloseTo(4, 1)
    expect((thick?.minLocalThickness ?? 0) - (thin?.minLocalThickness ?? 0)).toBeGreaterThan(1)
  })

  test('gate vertex remains the zero-arrival origin', () => {
    const field = buildSurfaceFillArrival(makeIndexedPlane([2, 2, 2, 2]), new THREE.Vector3(0, 0, 0))
    const arrival = field!.geometry.getAttribute('fillArrival') as THREE.BufferAttribute

    expect(arrival.getX(0)).toBe(0)
  })

  test('seam welding keeps duplicated surface vertices reachable', () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0, 10, 0, 0, 0, 10, 0,
      0, 0, 0, 0, 10, 0, 0, 0, 10,
    ], 3))
    geometry.setIndex([0, 1, 2, 3, 4, 5])

    const field = buildSurfaceFillArrival(geometry, new THREE.Vector3(0, 0, 0), { thicknessAvgMm: 2 })

    expect(field).not.toBeNull()
    expect(field?.reachableVertices).toBe(6)
    expect(field?.totalVertices).toBe(6)
    expect(Array.from(field!.geometry.getAttribute('fillArrival').array as Float32Array).every(Number.isFinite)).toBe(true)
  })
})
