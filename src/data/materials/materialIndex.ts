import materialCatalog from "./materialCatalog";
import type { MaterialProfile, Polymer, Reinforcement, ViscosityClass } from "./materialTypes";

export function getMaterialById(id?: string | null): MaterialProfile | undefined {
  if (!id) return undefined;
  const pid = String(id).toUpperCase();
  return materialCatalog.find(m => String(m.id).toUpperCase() === pid);
}

export function getMaterialFallback(args: {
  polymer: Polymer;
  reinforcement?: Reinforcement;
  gfPercent?: 30 | 60;
  viscosityClass?: ViscosityClass;
}): MaterialProfile {
  const { polymer, reinforcement = "NONE", gfPercent } = args;

  const exact = materialCatalog.find(m =>
    m.polymer === polymer &&
    m.reinforcement === reinforcement &&
    (reinforcement !== "GF" || m.gfPercent === gfPercent)
  );
  if (exact) return exact;

  const base = materialCatalog.find(m => m.polymer === polymer && m.reinforcement === "NONE");
  if (base) return base;

  return materialCatalog.find(m => m.id === "PP-GEN") as MaterialProfile;
}

export { materialCatalog } from "./materialCatalog";
