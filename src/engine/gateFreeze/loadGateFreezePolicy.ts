export type GateFreezeRec = {
  recommended_hold_s: number
  confidence?: number
  points?: number
  reason?: string
  valid_for?: { recipeFingerprint?: string; materialId?: string | null; pressId?: string | null }
}

type GateFreezeStore = {
  generatedAt?: string
  fingerprints: Record<string, GateFreezeRec>
}

let cache: GateFreezeStore | null = null
let loading: Promise<void> | null = null

async function loadOnce(): Promise<void> {
  if (cache) return
  if (loading) return loading
  loading = (async () => {
    try {
      const res = await fetch('/gate-freeze/recommended_by_recipeFingerprint.json', { cache: 'no-store' })
      if (!res.ok) {
        cache = { fingerprints: {} }
        return
      }
      const parsed = await res.json()
      cache = { fingerprints: parsed?.fingerprints ?? {}, generatedAt: parsed?.generatedAt }
    } catch (e) {
      cache = { fingerprints: {} }
    }
  })()
  return loading
}

export async function getGateFreezeRecommendation(fingerprint?: string | null): Promise<GateFreezeRec | null> {
  if (!fingerprint) return null
  await loadOnce()
  if (!cache) return null
  return cache.fingerprints[fingerprint] ?? null
}

export async function preloadGateFreezePolicy(): Promise<void> {
  await loadOnce()
}

export default { getGateFreezeRecommendation, preloadGateFreezePolicy }
