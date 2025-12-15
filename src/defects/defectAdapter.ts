import type { DefectId, DefectSeverity } from "./defectRules";

export type LegacyDefectId = string | null | undefined;

export function mapLegacyDefectId(id: LegacyDefectId): DefectId | null {
  if (!id) return null;

  // normalize: uppercase and convert non-alphanumeric to underscore (handles hyphens, spaces, etc.)
  const k = String(id).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  switch (k) {
    case "SHORT_SHOT":
      return "short_shot";
    case "BAVE":
    case "FLASH":
      return "flash";
    case "RITIRO":
    case "SINK":
      return "sink";
    case "DEFORMAZIONE":
    case "WARPAGE":
      return "warpage";
    default:
      return null;
  }
}

export function mapLegacySeverity(sev: any): DefectSeverity {
  const s = String(sev ?? "").toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s as DefectSeverity;
  return "medium";
}

export default { mapLegacyDefectId, mapLegacySeverity };
