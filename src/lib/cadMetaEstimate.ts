export type BBoxMM = { x: number; y: number; z: number }

export function estimateThicknessFromBbox(bbox: Partial<BBoxMM> | null | undefined): number | undefined {
  if (!bbox) return undefined
  const x = Number(bbox.x ?? 0)
  const y = Number(bbox.y ?? 0)
  const z = Number(bbox.z ?? 0)
  const minDim = Math.min(x || Infinity, y || Infinity, z || Infinity)
  if (!isFinite(minDim) || minDim <= 0) return undefined
  // crude clamp: realistic injection-molding thickness range
  const clamped = Math.max(0.6, Math.min(8, minDim))
  // round to one decimal for stability
  return Math.round(clamped * 10) / 10
}

export function estimateFlowLengthFromBbox(bbox: Partial<BBoxMM> | null | undefined): number | undefined {
  if (!bbox) return undefined
  const x = Number(bbox.x ?? 0)
  const y = Number(bbox.y ?? 0)
  const z = Number(bbox.z ?? 0)
  const maxDim = Math.max(x || 0, y || 0, z || 0)
  if (!isFinite(maxDim) || maxDim <= 0) return undefined
  // round to integer mm
  return Math.round(maxDim)
}
