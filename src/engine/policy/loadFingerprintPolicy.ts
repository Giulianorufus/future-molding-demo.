export type FingerprintPolicyRec = {
  gateFreeze?: {
    recommended_hold_s: number
    confidence?: number
    points?: number
    reason?: string
  } | null
  packing?: {
    recommended_holdingPressure_bar?: number
    confidence?: number
    points?: number
    reason?: string
  } | null
  valid_for?: { recipeFingerprint?: string; materialId?: string | null; pressId?: string | null }
}

type PolicyStore = { generatedAt?: string; fingerprints: Record<string, FingerprintPolicyRec> }

let cache: PolicyStore | null = null
let loading: Promise<void> | null = null

async function loadOnce(): Promise<void> {
  if (cache) return
  if (loading) return loading
  loading = (async () => {
    try {
      const res = await fetch('/policy/recommended_by_recipeFingerprint.json', { cache: 'no-store' })
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

export async function getFingerprintPolicy(fingerprint?: string | null): Promise<FingerprintPolicyRec | null> {
  if (!fingerprint) return null
  await loadOnce()
  if (!cache) return null
  return cache.fingerprints[fingerprint] ?? null
}

export async function preloadFingerprintPolicy(): Promise<void> {
  await loadOnce()
}

export default { getFingerprintPolicy, preloadFingerprintPolicy }
