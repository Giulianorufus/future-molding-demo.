import type { CaseQuery, CaseRecord, SimilarityResult } from "./caseTypes";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function relSimilarity(a?: number, b?: number): number | undefined {
  if (a === undefined || b === undefined) return undefined;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  const relDiff = Math.abs(a - b) / denom; // 0 = identico
  // mappa: relDiff 0 -> 1, relDiff >= 1 -> 0
  return clamp(1 - relDiff, 0, 1);
}

export function scoreCaseSimilarity(query: CaseQuery, candidate: CaseRecord): SimilarityResult {
  let score = 0;
  const reasons: string[] = [];

  // Fingerprint ricetta (forte)
  if (query.recipeFingerprint && candidate.recipeFingerprint && query.recipeFingerprint === candidate.recipeFingerprint) {
    score += 35;
    reasons.push("recipeFingerprint match");
  }

  // Materiale (molto forte)
  if (query.materialId && candidate.materialId && query.materialId === candidate.materialId) {
    score += 40;
    reasons.push("material match");
  }

  // Pressa
  if (query.pressId && candidate.pressId && query.pressId === candidate.pressId) {
    score += 10;
    reasons.push("press match");
  }

  // Vite
  if (
    query.screwDiameter_mm !== undefined &&
    candidate.screwDiameter_mm !== undefined &&
    query.screwDiameter_mm === candidate.screwDiameter_mm
  ) {
    score += 5;
    reasons.push("screw match");
  }

  // Geometria
  if (query.geometryHash && candidate.geometryHash && query.geometryHash === candidate.geometryHash) {
    score += 25;
    reasons.push("geometry match");
  }

  // Shot volume (similitudine quantitativa)
  const shotSim = relSimilarity(query.shotVolume_cm3, candidate.shotVolume_cm3);
  if (shotSim !== undefined) {
    const pts = Math.round(15 * shotSim);
    score += pts;
    if (pts > 0) reasons.push(`shotVolume similar (+${pts})`);
  }

  // Area proiettata (similitudine quantitativa)
  const areaSim = relSimilarity(query.projectedArea_cm2, candidate.projectedArea_cm2);
  if (areaSim !== undefined) {
    const pts = Math.round(5 * areaSim);
    score += pts;
    if (pts > 0) reasons.push(`projectedArea similar (+${pts})`);
  }

  score = clamp(score, 0, 100);

  return {
    caseId: candidate.id,
    score,
    reasons,
  };
}
