export type CadAnalysisCacheKey = string;

type CacheEntry<T> = { at: number; value: T };

const MAX_ENTRIES = 20;
const cache = new Map<CadAnalysisCacheKey, CacheEntry<unknown>>();

function touch(key: CadAnalysisCacheKey, entry: CacheEntry<unknown>) {
  cache.delete(key);
  cache.set(key, entry);
}

function evictIfNeeded() {
  while (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

export function getCadAnalysisCached<T>(key: CadAnalysisCacheKey): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  touch(key, entry);
  return entry.value as T;
}

export function setCadAnalysisCached<T>(key: CadAnalysisCacheKey, value: T): void {
  cache.set(key, { at: Date.now(), value });
  evictIfNeeded();
}

export function clearCadAnalysisCache(): void {
  cache.clear();
}
