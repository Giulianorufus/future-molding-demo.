/**
 * La quota del pezzo si applica dopo il riempimento dei canali freddi.
 * I volumi sono riferiti alla singola stampata e sono espressi in cm³.
 */
export interface VpShotGeometry {
  totalPartsVolumeCm3: number;
  runnerVolumeCm3: number;
}

export interface VpSwitchPoint {
  injectedVolumeCm3: number;
  shotPercent: number;
  partFillPercent: number;
}

const roundSix = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

export function computeVpSwitch(
  geometry: VpShotGeometry,
  partFillPercent: number,
): VpSwitchPoint | null {
  const { totalPartsVolumeCm3, runnerVolumeCm3 } = geometry;
  if (
    !Number.isFinite(totalPartsVolumeCm3) || totalPartsVolumeCm3 <= 0 ||
    !Number.isFinite(runnerVolumeCm3) || runnerVolumeCm3 < 0 ||
    !Number.isFinite(partFillPercent) || partFillPercent <= 0 || partFillPercent >= 100
  ) return null;

  const shotVolumeCm3 = roundSix(totalPartsVolumeCm3 + runnerVolumeCm3);
  const injectedVolumeCm3 = roundSix(runnerVolumeCm3 + totalPartsVolumeCm3 * partFillPercent / 100);
  if (shotVolumeCm3 <= 0 || injectedVolumeCm3 <= 0 || injectedVolumeCm3 >= shotVolumeCm3) return null;
  return {
    injectedVolumeCm3,
    shotPercent: injectedVolumeCm3 / shotVolumeCm3 * 100,
    partFillPercent,
  };
}
