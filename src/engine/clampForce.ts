export function recommendedClampForceTon(
  projAreaCm2: number,
  material: "PP" | "ABS" | "PCABS" | "PA66GF"
): number {
  let pressureGcm2: number;

  switch (material) {
    case "PP":
      pressureGcm2 = 330;
      break;
    case "ABS":
      pressureGcm2 = 380;
      break;
    case "PCABS":
      pressureGcm2 = 430;
      break;
    case "PA66GF":
      pressureGcm2 = 500;
      break;
  }

  const forceTon = (projAreaCm2 * pressureGcm2) / 1000;
  return Math.round(forceTon);
}
