import * as THREE from 'three'
import {
  buildSurfaceFillArrival,
  computeFlowCost,
  computeThicknessFactor,
  computeViscosityFactor,
} from './fillArrival'
import { materialCatalog } from '@/data/materialCatalog'

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

  test('material flow factor changes propagation cost and uses canonical catalog values', () => {
    const pc = materialCatalog.find((material) => material.id === 'pc')!
    const pp = materialCatalog.find((material) => material.id === 'pp')!
    const mesh = makeIndexedPlane([2, 2, 2, 2])
    const pcField = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0), {
      processContext: { materialId: pc.id, materialFlowFactor: pc.flowFactor },
    })
    const ppField = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0), {
      processContext: { materialId: pp.id, materialFlowFactor: pp.flowFactor },
    })

    expect(pc.flowFactor).not.toBe(pp.flowFactor)
    expect(pcField?.viscosityFactor).toBe(computeViscosityFactor(pc.flowFactor))
    expect(ppField?.viscosityFactor).toBe(computeViscosityFactor(pp.flowFactor))
    expect(pcField?.maxDistance).toBeGreaterThan(ppField?.maxDistance ?? 0)
  })

  test('keeps normalized spatial arrival separate from raw PP/PC resistance', () => {
    const pp = materialCatalog.find((material) => material.id === 'pp')!
    const pc = materialCatalog.find((material) => material.id === 'pc')!
    const mesh = makeIndexedPlane([2, 2, 2, 2])
    const ppField = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0), {
      processContext: { materialId: pp.id, materialFlowFactor: pp.flowFactor },
    })!
    const pcField = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0), {
      processContext: { materialId: pc.id, materialFlowFactor: pc.flowFactor },
    })!
    const expectedRatio = (1 / pc.flowFactor) / (1 / pp.flowFactor)

    expect(pcField.spatialFillArrival).toEqual(ppField.spatialFillArrival)
    expect(pcField.maxRawArrival).toBeGreaterThan(ppField.maxRawArrival)
    expect(pcField.maxRawArrival / ppField.maxRawArrival).toBeCloseTo(expectedRatio, 6)
    expect(ppField.spatialFillArrival[0]).toBe(0)
    expect(pcField.spatialFillArrival[0]).toBe(0)
    expect(pcField.materialId).toBe('pc')
    expect(pcField.viscosityFactor).toBeCloseTo(1 / pc.flowFactor)
  })

  test('neutral and absent material context preserve geometric behavior', () => {
    const mesh = makeIndexedPlane([2, 2, 2, 2])
    const absent = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0))
    const neutral = buildSurfaceFillArrival(mesh, new THREE.Vector3(0, 0, 0), {
      processContext: { materialFlowFactor: 1 },
    })

    expect(absent?.viscosityFactor).toBe(1)
    expect(neutral?.viscosityFactor).toBe(1)
    expect(neutral?.maxDistance).toBe(absent?.maxDistance)
    expect(Array.from(neutral!.geometry.getAttribute('fillArrival').array as Float32Array))
      .toEqual(Array.from(absent!.geometry.getAttribute('fillArrival').array as Float32Array))
  })

  test.each([NaN, Infinity, 0, -1])('invalid material flow factor %p is finite and neutral', (value) => {
    const field = buildSurfaceFillArrival(makeIndexedPlane([2, 2, 2, 2]), new THREE.Vector3(0, 0, 0), {
      processContext: { materialFlowFactor: value },
    })

    expect(field?.viscosityFactor).toBe(1)
    expect(Number.isFinite(field?.maxDistance)).toBe(true)
    expect(Array.from(field!.geometry.getAttribute('fillArrival').array as Float32Array).every(Number.isFinite)).toBe(true)
  })

  test('thickness still changes cost with material context active', () => {
    const viscosityFactor = computeViscosityFactor(0.9)

    expect(computeFlowCost(10, 2, 1) * viscosityFactor)
      .toBeGreaterThan(computeFlowCost(10, 2, 4) * viscosityFactor)
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
