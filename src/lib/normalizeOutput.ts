// src/lib/normalizeOutput.ts
import type { AppliedCorrection } from "../types/appliedCorrection";

export function normalizeStringArray(arr?: string[] | null): string[] {
  if (!arr || arr.length === 0) return [];
  const set = new Set<string>();
  for (const s of arr) {
    const v = (s ?? "").toString().trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function correctionKey(c: Partial<AppliedCorrection>): string {
  const id = (c.id ?? "").toString().trim().toLowerCase();
  if (id) return id;

  const type = (c.type ?? "unknown").toString().trim().toLowerCase();
  const target = (c.target ?? "unknown").toString().trim().toLowerCase();
  return `${type}:${target}`;
}

export function normalizeCorrections(arr?: Array<Partial<AppliedCorrection> | string> | null): AppliedCorrection[] {
  if (!arr || arr.length === 0) return [];
  const map = new Map<string, Partial<AppliedCorrection>>();

  for (const raw of arr) {
    if (!raw || (typeof raw !== 'object' && typeof raw !== 'string')) continue;
    if (typeof raw === 'string') continue; // we drop legacy strings in new schema
    const key = correctionKey(raw as Partial<AppliedCorrection>);
    map.set(key, raw as Partial<AppliedCorrection>); // last wins
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, c]) => {
      const type = (c.type ?? 'estimate') as AppliedCorrection['type'];
      const target = (c.target ?? 'unknown').toString();
      const id = (c.id ?? `${String(type)}:${target}`).toString();
      const action = (c.action ?? 'set') as AppliedCorrection['action'];

      return {
        id,
        type,
        target,
        action,
        unit: typeof c.unit === 'string' ? c.unit : undefined,
        before: typeof c.before === 'number' ? c.before : undefined,
        after: typeof c.after === 'number' ? c.after : undefined,
        delta: typeof c.delta === 'number' ? c.delta : undefined,
        reason: typeof c.reason === 'string' ? c.reason : undefined,
        source: typeof c.source === 'string' ? c.source : undefined,
        meta: typeof c.meta === 'object' && c.meta ? (c.meta as Record<string, unknown>) : undefined,
      } as AppliedCorrection;
    });
}

export default { normalizeCorrections, normalizeStringArray };
