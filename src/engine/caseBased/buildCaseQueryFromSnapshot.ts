import type { RecipeSnapshot } from "../recipeExport/recipeTypes";
import type { CaseQuery } from "./caseTypes";

function pickNumber(obj: any, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function pickString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export function buildCaseQueryFromSnapshot(snapshot: RecipeSnapshot): CaseQuery {
  const pressId = snapshot.press?.id ?? pickString(snapshot.input, ["pressId", "press_id"]) ?? pickString(snapshot.output, ["pressId"]);
  const materialId =
    snapshot.material?.id ??
    pickString(snapshot.input, ["materialId", "material_id"]) ??
    pickString(snapshot.output, ["materialId"]);

  const screwDiameter_mm =
    snapshot.press?.screwDiameter_mm ??
    pickNumber(snapshot.input, ["screwDiameter_mm", "screw_mm"]) ??
    pickNumber(snapshot.output, ["screwDiameter_mm"]);

  // Best-effort: se in futuro mettiamo geometryHash/area/shot in snapshot.output li prenderà.
  const geometryHash = pickString(snapshot.output, ["geometryHash", "cadHash", "geometry_hash"]);
  const projectedArea_cm2 = pickNumber(snapshot.output, ["projectedArea_cm2", "projectedAreaCm2"]);
  const shotVolume_cm3 = pickNumber(snapshot.output, ["shotVolume_cm3", "shotVolumeCm3", "shot_cm3"]);

  // recipeFingerprint: se non c";
  const recipeFingerprint = pickString(snapshot.meta as any, ["recipeFingerprint", "fingerprint", "hash"]);

  return {
    recipeFingerprint,
    materialId,
    pressId,
    screwDiameter_mm,
    geometryHash,
    projectedArea_cm2,
    shotVolume_cm3,
  };
}
