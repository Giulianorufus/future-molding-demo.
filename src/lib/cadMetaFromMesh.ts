import { computeSurfaceArea_mm2, computeSignedVolume_mm3, computeProjectedHullArea_mm2, computeHullDiameter_mm } from './meshMetrics'
import { projectedAreaFromMesh } from './projectedAreaFromMesh'

export function buildCadAnalysisMetaFromMesh({ positions, indices, bbox_mm }: { positions: Float32Array | number[]; indices?: Uint32Array | number[]; bbox_mm?: { x: number; y: number; z: number } | null }) {
  const pos = Array.isArray(positions) ? positions : Array.from(positions)
  const surface_mm2 = computeSurfaceArea_mm2(pos, indices)
  const vol_mm3 = computeSignedVolume_mm3(pos, indices)
  const projectedTriRes = require('./projectedAreaFromMesh').projectedAreaFromMesh(pos, indices, 'z')
  const projectedTri_mm2 = Math.round((projectedTriRes.projectedArea_cm2 * 100) * 100) / 100 // cm2->mm2
  const projectedHull_mm2 = computeProjectedHullArea_mm2(pos, 'z')
  const hullDiameter = computeHullDiameter_mm(pos, 'z')

  const volume_cm3 = Math.round((Math.abs(vol_mm3) / 1000) * 100) / 100
  const surfaceArea_mm2 = Math.round(surface_mm2 * 100) / 100

  let thickness_mm: number | undefined = undefined
  if (surfaceArea_mm2 > 0 && Math.abs(vol_mm3) > 0) {
    const raw = (2 * Math.abs(vol_mm3)) / surfaceArea_mm2
    thickness_mm = Math.round(Math.max(0.6, Math.min(8, raw)) * 10) / 10
  } else if (bbox_mm) {
    thickness_mm = Math.round(Math.max(0.6, Math.min(8, Math.min(bbox_mm.x, bbox_mm.y, bbox_mm.z) || 0)) * 10) / 10
  }

  const projectedAreaHull_cm2 = Math.round((projectedHull_mm2 / 100) * 100) / 100
  const projectedAreaTriangles_cm2 = Math.round((projectedTri_mm2 / 100) * 100) / 100
  // Stabilized area for clamp: use hull area to avoid double-counting overlapping triangles
  const projectedArea_cm2 = projectedAreaHull_cm2

  return {
    volume_cm3,
    surfaceArea_mm2,
    thickness_mm,
    flowLength_mm: Math.round(hullDiameter),
    projectedAreaTriangles_cm2,
    projectedAreaHull_cm2,
    projectedArea_cm2,
    projectedAreaReason: `projectedArea:hull;hull_cm2=${projectedAreaHull_cm2};tri_cm2=${projectedAreaTriangles_cm2}`,
  }
}
