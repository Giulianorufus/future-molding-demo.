// src/engine/recipeExport/buildRecipeSnapshot.ts
import type { RecipeSnapshot } from "./recipeTypes";
import { PRESS_CATALOG_VERSION } from "../../data/pressCatalog/pressCatalogVersion";
import { VERSION as MATERIALS_VERSION } from "../../data/materialLibrary";

export function buildRecipeSnapshot(opts: {
  projectName?: string | null;
  input?: Record<string, any>;
  output?: Record<string, any>;
  press?: { id?: string; model?: string; screwDiameter_mm?: number; limits?: Record<string, any> };
  material?: { id?: string; name?: string; factors?: Record<string, number> };
  warnings?: string[];
  assumptions?: string[];
  defect?: { id?: string; severity?: string; audit?: string[] } | null;
  recipeFingerprint?: string;
  appVersion?: string;
}): RecipeSnapshot {
  const ts = new Date().toISOString();
  const appVersion = opts.appVersion ?? ((typeof process !== 'undefined' && (process.env?.VITE_APP_VERSION as string)) || (typeof process !== 'undefined' && process.env?.npm_package_version) || "dev");

  const meta = {
    projectName: opts.projectName ?? null,
    recipeFingerprint: opts.recipeFingerprint,
    timestampISO: ts,
    appVersion: String(appVersion),
    pressCatalogVersion: String(PRESS_CATALOG_VERSION ?? "unknown"),
    materialsVersion: String(MATERIALS_VERSION ?? "unknown"),
  };

  return {
    meta,
    press: opts.press ?? undefined,
    material: opts.material ?? undefined,
    input: opts.input ?? undefined,
    output: opts.output ?? undefined,
    warnings: opts.warnings ?? [],
    assumptions: opts.assumptions ?? [],
    defect: opts.defect ?? null,
  };
}
