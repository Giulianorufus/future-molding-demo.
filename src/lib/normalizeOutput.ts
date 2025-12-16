// src/lib/normalizeOutput.ts

export type AppliedCorrection = {
  type?: string;
  target?: string;
  // opzionali (non imponiamo schema rigido)
  value?: number;
  delta?: number;
  unit?: string;
  reason?: string;
  source?: string;
  [k: string]: unknown;
};

export function normalizeStringArray(arr?: string[] | null): string[] {
  if (!arr || arr.length === 0) return [];
  const set = new Set<string>();
  for (const s of arr) {
    const v = (s ?? "").toString().trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function correctionKey(c: AppliedCorrection): string {
  const type = (c.type ?? "").toString().trim().toLowerCase();
  const target = (c.target ?? "").toString().trim().toLowerCase();

  if (type && target) return `${type}:${target}`;

  // fallback deterministico: usa solo un sottoinsieme stabile
  const v =
    typeof c.value === "number" ? c.value :
    typeof c.delta === "number" ? c.delta :
    "";
  const u = (c.unit ?? "").toString().trim().toLowerCase();
  const r = (c.reason ?? "").toString().trim().toLowerCase();

  return `${type || "unknown"}:${target || "unknown"}:${v}:${u}:${r}`;
}

export function normalizeCorrections(arr?: (AppliedCorrection | string)[] | null): (AppliedCorrection | string)[] {
  if (!arr || arr.length === 0) return [];

  // Separate string entries (legacy plain messages) and structured corrections
  const stringSet = new Set<string>();
  const map = new Map<string, AppliedCorrection>();

  for (const raw of arr) {
    if (typeof raw === 'string') {
      const v = raw.toString().trim();
      if (v) stringSet.add(v);
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const c = raw as AppliedCorrection;
    const key = correctionKey(c);
    map.set(key, c);
  }

  const structured = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, c]) => c as AppliedCorrection);

  const strings = Array.from(stringSet).sort((a, b) => a.localeCompare(b));

  // merge: structured entries first (stable), then legacy strings
  return [...structured, ...strings];
}

export default { normalizeCorrections, normalizeStringArray };
