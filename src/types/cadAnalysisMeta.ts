export type BBoxMM = {
  x: number
  y: number
  z: number
}

export type CadAnalysisMeta = {
  bbox_mm?: Partial<BBoxMM>
  projectedArea_cm2?: number
}
