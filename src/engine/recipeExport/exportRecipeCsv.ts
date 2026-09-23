// src/engine/recipeExport/exportRecipeCsv.ts
import type { RecipeSnapshot } from "./recipeTypes";

function fmtNum(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

export function exportRecipeCsv(snapshot: RecipeSnapshot): string {
  // fixed column order
  const cols = [
    "projectName",
    "timestampISO",
    "appVersion",
    "pressCatalogVersion",
    "materialsVersion",
    "press_id",
    "press_model",
    "press_screw_mm",
    "material_id",
    "material_name",
    "shotVolumeCm3",
    "warnings",
    "assumptions",
  ];

  const header = cols.join(";");

  const row = [
    snapshot.meta.projectName ?? "",
    snapshot.meta.timestampISO,
    snapshot.meta.appVersion,
    snapshot.meta.pressCatalogVersion,
    snapshot.meta.materialsVersion,
    snapshot.press?.id ?? "",
    snapshot.press?.model ?? "",
    snapshot.press?.screwDiameter_mm ? fmtNum(snapshot.press.screwDiameter_mm) : "",
    snapshot.material?.id ?? "",
    snapshot.material?.name ?? "",
    snapshot.output?.shotVolumeCm3 ?? snapshot.input?.shotVolumeCm3 ?? "",
    (snapshot.warnings || []).join('|'),
    (snapshot.assumptions || []).join('|'),
  ];

  return header + "\n" + row.join(";") + "\n";
}
