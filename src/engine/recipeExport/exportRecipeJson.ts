// src/engine/recipeExport/exportRecipeJson.ts
import type { RecipeSnapshot } from "./recipeTypes";

export function exportRecipeJson(snapshot: RecipeSnapshot): string {
  // deterministic pretty JSON: stable property order enforced by builder
  return JSON.stringify(snapshot, null, 2);
}
