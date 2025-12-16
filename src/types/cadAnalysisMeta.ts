export type BBoxMM = {
  x: number
  y: number
  z: number
}

export type CadAnalysisMeta = {
  bbox_mm?: Partial<BBoxMM>
  projectedArea_cm2?: number
  thickness_mm?: number
  flowLength_mm?: number
  volume_cm3?: number
}

