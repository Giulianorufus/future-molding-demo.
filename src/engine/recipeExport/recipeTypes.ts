// src/engine/recipeExport/recipeTypes.ts

export type RecipeMeta = {
  projectName?: string | null;
  timestampISO: string;
  appVersion: string;
  pressCatalogVersion: string;
  materialsVersion: string;
};

export type RecipeSnapshot = {
  meta: RecipeMeta;
  press?: { id?: string; model?: string; screwDiameter_mm?: number; limits?: Record<string, any> };
  material?: { id?: string; name?: string; factors?: Record<string, number> };
  input?: Record<string, any>;
  output?: Record<string, any>;
  warnings?: string[];
  assumptions?: string[];
  defect?: { id?: string; severity?: string; audit?: string[] } | null;
};
