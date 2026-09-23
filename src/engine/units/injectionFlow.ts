/** Converte la velocità assiale della vite in portata volumetrica teorica. */
export function linearScrewSpeedToFlowCm3s(
  speedMmPerS: number | null | undefined,
  screwDiameterMm: number,
): number | null {
  if (
    typeof speedMmPerS !== 'number' || !Number.isFinite(speedMmPerS) || speedMmPerS <= 0 ||
    !Number.isFinite(screwDiameterMm) || screwDiameterMm <= 0
  ) return null

  // (mm/s) · (mm²) / 1000 = cm³/s; la portata reale richiede calibrazione.
  return speedMmPerS * Math.PI * screwDiameterMm ** 2 / 4 / 1000
}
