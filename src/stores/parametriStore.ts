import { create } from 'zustand'
import type { CaseRecord } from '../engine/caseBased'
import type { RecipeSnapshot } from '../engine/recipeExport/recipeTypes'
import { calcolaParametri, type CalculationInput, type CalculationResult } from '../core/calcEngine'
import { logInput, logOutput } from '../core/log'
import { getFingerprintPolicy, type FingerprintPolicyRec } from '../engine/policy/loadFingerprintPolicy'
import { buildPackingProfile } from '../engine/profiles'
import { useDrawingStore } from './drawingStore'
import { usePressStore } from './pressStore'
import { useMaterialStore } from './materialStore'
import { useDefectsStore } from './defectsStore'
import { applyDefectFix, type DefectSeverity } from '../defects/defectRules'
import { normalizeCorrections } from '../lib/normalizeOutput'
import { mapLegacyDefectId, mapLegacySeverity } from '../defects/defectAdapter'
import { estimateThicknessFromBbox, estimateFlowLengthFromBbox } from '../lib/cadMetaEstimate'
import { projectedAreaFromMesh, estimateProjectedAreaFromBboxFallback } from '../lib/projectedAreaFromMesh'

export type ParametriState = {
  lastInput: CalculationInput | null
  lastCalcInputHash?: string | null
  lastCalcResult?: CalculationResult | null
  result: CalculationResult | null
  isCalculating: boolean
  // compatibility: a `loading` boolean selector is used by presentational UI
  loading: boolean
  error: string | null
  lastDefectFix: null | {
    defectId: string
    severity: DefectSeverity
    delta?: Record<string, number>
    notes: string[]
  }
  baselineCaseId?: string | undefined
  baselineSnapshot?: RecipeSnapshot | undefined
  baselineProfiles?: {
    injectionProfile?: any[] | undefined
    packingProfile?: any[] | undefined
    switchover?: number | null
  } | undefined
  gateFreezeRecommendation?: FingerprintPolicyRec | null
  gateFreezeApplied?: boolean
  gateFreezeAppliedAtISO?: string | null
  gateFreezePreviousHold_s?: number | null
  applyGateFreezeIfEligible: (rec?: any | null) => boolean
  revertGateFreeze: () => boolean
  applyBaselineFromCase: (c: CaseRecord) => void
  ricalcola: (input: CalculationInput) => Promise<void>
  reset: () => void
}

export const useParametriStore = create<ParametriState>((set) => ({
  lastInput: null,
  lastCalcInputHash: null,
  lastCalcResult: null,
  result: null,
  isCalculating: false,
  loading: false,
  error: null,
  lastDefectFix: null,
  baselineCaseId: undefined,
  baselineSnapshot: undefined,
  baselineProfiles: undefined,
  async ricalcola(input) {
    set({ isCalculating: true, loading: true, error: null })
    try {
      try { logInput?.(input) } catch (_) {}
      // compute stable hash of the input to avoid unnecessary recalculations
      const stableStringify = (obj: any): string => {
        const seen = new WeakSet()
        const normalize = (v: any): any => {
          if (v === null || v === undefined) return v
          if (typeof v !== 'object') return v
          if (seen.has(v)) return undefined
          seen.add(v)
          if (Array.isArray(v)) return v.map(normalize)
          const keys = Object.keys(v).sort()
          const out: any = {}
          for (const k of keys) out[k] = normalize(v[k])
          return out
        }
        return JSON.stringify(normalize(obj))
      }
      // import hash helper
      const { sha256Hex } = await import('../engine/integrity')
      const inputStr = stableStringify(input)
      const inputHash = await sha256Hex(inputStr)
      // short-circuit if same hash and we have a cached result
      try {
        const state: any = (useParametriStore as any).getState()
        if (state.lastCalcInputHash && state.lastCalcInputHash === inputHash && state.lastCalcResult) {
          set({ lastInput: input, result: state.lastCalcResult, isCalculating: false, loading: false })
          return
        }
        // also check localStorage cache if available
        if (typeof window !== 'undefined' && window.localStorage) {
          const kHash = 'fm:lastCalcInputHash'
          const kRes = 'fm:lastCalcResult'
          const storedHash = window.localStorage.getItem(kHash)
          if (storedHash === inputHash) {
            const raw = window.localStorage.getItem(kRes)
            if (raw) {
              try { const parsed = JSON.parse(raw); set({ lastInput: input, result: parsed, lastCalcInputHash: inputHash, lastCalcResult: parsed, isCalculating: false, loading: false }); return } catch (_) {}
            }
          }
        }
      } catch (_) {}
          // build context from lastDefectFix and drawing bounding box if available
          const curLastDefect = (useParametriStore as any).getState?.().lastDefectFix ?? null
          const d = useDrawingStore.getState()
          const boundingBox = d?.boundingBox ?? null
          const bboxObj = boundingBox ? { x: Number(boundingBox.x ?? 0), y: Number(boundingBox.y ?? 0), z: Number(boundingBox.z ?? 0) } : null
          // attempt to build rich cadAnalysisMeta from mesh if available
          let cadAnalysisMeta: any = null
          try {
            const mesh: any = (d as any)?.mesh
            if (mesh && (mesh.positions || mesh.indices)) {
              const meta = require('../lib/cadMetaFromMesh').buildCadAnalysisMetaFromMesh({ positions: mesh.positions, indices: mesh.indices, bbox_mm: bboxObj })
              cadAnalysisMeta = {
                bbox_mm: bboxObj,
                projectedArea_cm2: meta.projectedArea_cm2,
                thickness_mm: meta.thickness_mm,
                flowLength_mm: meta.flowLength_mm,
                volume_cm3: meta.volume_cm3,
                surfaceArea_mm2: meta.surfaceArea_mm2,
                _projectedAreaReason: meta.projectedAreaReason,
              }
            }
          } catch (_) {
            // ignore mesh errors; fall back to bbox-based estimates
          }

          if (!cadAnalysisMeta && bboxObj) {
            const fallbackArea = estimateProjectedAreaFromBboxFallback(bboxObj, 'z')
            cadAnalysisMeta = {
              bbox_mm: bboxObj,
              projectedArea_cm2: d?.surfaceCm2 ?? fallbackArea.projectedArea_cm2,
              thickness_mm: estimateThicknessFromBbox(bboxObj),
              flowLength_mm: estimateFlowLengthFromBbox(bboxObj),
              _projectedAreaReason: fallbackArea.reason,
            }
          }
          // include any appliedCorrections from the latest lastDefectFix state
          const latestDefect = (useParametriStore as any).getState?.().lastDefectFix ?? null
          const context: any = {
            defectId: latestDefect?.defectId ?? null,
            severity: latestDefect?.severity ?? null,
            cadAnalysisMeta,
            appliedCorrections: latestDefect?.appliedCorrections ?? undefined,
          }

          const res = calcolaParametri(input as any, context) as CalculationResult
          // persist hash + result in-memory and to localStorage (best-effort)
          try {
            ;(useParametriStore as any).setState({ lastCalcInputHash: inputHash, lastCalcResult: res })
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                window.localStorage.setItem('fm:lastCalcInputHash', inputHash)
                window.localStorage.setItem('fm:lastCalcResult', JSON.stringify(res))
              } catch (_) {}
            }
          } catch (_) {}
      try { logOutput?.(res) } catch (_) {}

      // attempt to enrich result with gate-freeze recommendation if a fingerprint is available
      try {
        let fingerprint: string | null = null
        try { fingerprint = (useParametriStore as any).getState?.().baselineSnapshot?.meta?.recipeFingerprint ?? null } catch (_) { fingerprint = null }
        try { if (!fingerprint && (res as any)?.meta?.recipeFingerprint) fingerprint = (res as any).meta.recipeFingerprint } catch (_) {}
        try {
          if (!fingerprint && typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('fm:lastCalcResult')
            if (raw) {
              const parsed = JSON.parse(raw)
              fingerprint = parsed?.meta?.recipeFingerprint ?? null
            }
          }
        } catch (_) {}

          let rec: FingerprintPolicyRec | null = null
          if (fingerprint) {
            try { rec = await getFingerprintPolicy(fingerprint) } catch (_) { rec = null }
          }

          // store basic recommendation (may include gateFreeze and/or packing)
          set({ lastInput: input, result: res, isCalculating: false, loading: false, gateFreezeRecommendation: rec })

        // Non-invasivo: applica automaticamente solo se ricetta trova raccomandazione e passa guardrail
        try {
          const stateAny: any = (useParametriStore as any).getState()
          // guardrail checks
          // rec may be unified fingerprint policy; check gateFreeze subsection
          const gf = rec?.gateFreeze ?? null
          if (gf && typeof gf.recommended_hold_s === 'number') {
            const conf = Number(gf.confidence ?? 0)
            const pts = Number(gf.points ?? 0)
            const hold = Number(gf.recommended_hold_s)
            const minHoldOk = hold >= 0.1
            const confOk = conf >= 0.7
            const ptsOk = pts >= 10
            // do not override if user already has packingProfile present
            const hasUserPacking = !!(res as any)?.packingProfile
            // limit upper bound: packingProfile.totalTime_s if exists else 10s
            const upperOk = hold <= 10
            if (minHoldOk && confOk && ptsOk && upperOk && !hasUserPacking) {
              try {
                // build default packing profile and scale its times to match recommended hold
                const pbInput: any = {
                  thicknessAvg_mm: (stateAny?.cadAnalysisMeta?.thickness_mm) ?? undefined,
                  materialId: (stateAny?.baselineSnapshot?.meta?.materialId) ?? undefined,
                  targetInjectionSpeed_cm3_s: (res as any)?.suggestedInjectionSpeedCm3s ?? (res as any)?.injectionSpeedCm3s ?? 50,
                  maxInjectionSpeed_cm3_s:  (stateAny?.press?.maxSpeedCm3s) ?? ((stateAny?.press?.maxInjectionSpeed_cm3_s) ?? ((res as any)?.velIniezione ?? 100)),
                  peakInjectionPressure_bar: (res as any)?.packPressureBar ?? (res as any)?.packPressione ?? 50,
                  maxInjectionPressure_bar: (stateAny?.press?.maxPressureBar) ?? 400,
                }
                const built = buildPackingProfile(pbInput as any)
                const defaultTotal = built.holdingTimeTotal_s || built.holdingTimeTotal_s === 0 ? built.holdingTimeTotal_s : null
                // scale factor: recommended / defaultTotal (if defaultTotal present)
                const scale = defaultTotal && defaultTotal > 0 ? (hold / defaultTotal) : 1
                const scaledSteps = built.packingProfile.map((s: any) => ({ step: s.step, pressure_bar: s.pressure_bar, time_s: Math.round((s.time_s * scale) * 10) / 10 }))
                // compute previous total (if any)
                const prevTotal = Array.isArray((res as any)?.packingProfile?.steps) ? (res as any).packingProfile.steps.reduce((a: number, b: any) => a + (Number(b.time_s) || 0), 0) : null
                // apply into result
                ;(res as any).packingProfile = { steps: scaledSteps }
                // mark applied metadata in store
                ;(useParametriStore as any).setState({ lastCalcResult: res, gateFreezeApplied: true, gateFreezeAppliedAtISO: new Date().toISOString(), gateFreezePreviousHold_s: prevTotal })
              } catch (_) {}
            }
          }
        } catch (_) {}
      } catch (e) {
        // ignore enrichment failures
      }
    } catch (err: any) {
      set({ error: String(err?.message ?? err), isCalculating: false, loading: false })
    }
  },
  reset() {
    set({ lastInput: null, result: null, isCalculating: false, loading: false, error: null, lastDefectFix: null })
  },
  applyGateFreezeIfEligible(rec) {
    try {
      const stateAny: any = (useParametriStore as any).getState()
      const res: any = stateAny.result ?? stateAny.lastCalcResult
      if (!res || !rec) return false
      const conf = Number(rec.confidence ?? 0)
      const pts = Number(rec.points ?? 0)
      const hold = Number(rec.recommended_hold_s)
      if (!(hold >= 0.1 && conf >= 0.7 && pts >= 10)) return false
      // do not override if packingProfile exists
      if (res.packingProfile && Array.isArray(res.packingProfile.steps) && res.packingProfile.steps.length) return false
      // upper bound
      if (!(hold <= 10)) return false
      // build and apply
      const pbInput: any = {
        thicknessAvg_mm: (stateAny?.cadAnalysisMeta?.thickness_mm) ?? undefined,
        materialId: (stateAny?.baselineSnapshot?.meta?.materialId) ?? undefined,
        targetInjectionSpeed_cm3_s: res.suggestedInjectionSpeedCm3s ?? res.injectionSpeedCm3s ?? 50,
        maxInjectionSpeed_cm3_s: (stateAny?.press?.maxSpeedCm3s) ?? (res.suggestedInjectionSpeedCm3s ?? 100),
        peakInjectionPressure_bar: res.packPressureBar ?? res.packPressione ?? 50,
        maxInjectionPressure_bar: (stateAny?.press?.maxPressureBar) ?? 400,
      }
      const built = buildPackingProfile(pbInput as any)
      const defaultTotal = built.holdingTimeTotal_s || 0
      const scale = defaultTotal > 0 ? (hold / defaultTotal) : 1
      const scaledSteps = built.packingProfile.map((s: any) => ({ step: s.step, pressure_bar: s.pressure_bar, time_s: Math.round((s.time_s * scale) * 10) / 10 }))
      const prevTotal = Array.isArray(res?.packingProfile?.steps) ? res.packingProfile.steps.reduce((a: number, b: any) => a + (Number(b.time_s) || 0), 0) : null
      // apply
      const nextRes = { ...(res as any), packingProfile: { steps: scaledSteps } }
      ;(useParametriStore as any).setState({ result: nextRes, lastCalcResult: nextRes, gateFreezeApplied: true, gateFreezeAppliedAtISO: new Date().toISOString(), gateFreezePreviousHold_s: prevTotal })
      return true
    } catch (e) {
      return false
    }
  },
  revertGateFreeze() {
    try {
      const stateAny: any = (useParametriStore as any).getState()
      const res: any = stateAny.result ?? stateAny.lastCalcResult
      if (!res) return false
      const prev = stateAny.gateFreezePreviousHold_s
      if (prev == null) {
        // remove applied packingProfile
        const nextRes = { ...(res as any) }
        delete nextRes.packingProfile
        ;(useParametriStore as any).setState({ result: nextRes, lastCalcResult: nextRes, gateFreezeApplied: false, gateFreezeAppliedAtISO: null, gateFreezePreviousHold_s: null })
        return true
      }
      // if prev present, scale current profile back to prev total
      if (res.packingProfile && Array.isArray(res.packingProfile.steps)) {
        const currentTotal = res.packingProfile.steps.reduce((a: number, b: any) => a + (Number(b.time_s) || 0), 0)
        if (currentTotal > 0) {
          const scale = prev / currentTotal
          const restored = res.packingProfile.steps.map((s: any) => ({ step: s.step, pressure_bar: s.pressure_bar, time_s: Math.round((s.time_s * scale) * 10) / 10 }))
          const nextRes = { ...(res as any), packingProfile: { steps: restored } }
          ;(useParametriStore as any).setState({ result: nextRes, lastCalcResult: nextRes, gateFreezeApplied: false, gateFreezeAppliedAtISO: null, gateFreezePreviousHold_s: null })
          return true
        }
      }
      return false
    } catch (e) {
      return false
    }
  },
  applyBaselineFromCase(c) {
    try {
      // prefill baseline metadata in this store
      set((s: any) => ({
        ...s,
        baselineCaseId: c.id,
        baselineSnapshot: c.recipeSnapshot as RecipeSnapshot,
      }))

      try {
        const out: any = (c.recipeSnapshot as any)?.output ?? {}
        const profiles: any = {}
        if (out?.injectionProfile) profiles.injectionProfile = out.injectionProfile
        if (out?.packingProfile) profiles.packingProfile = out.packingProfile
        // switchover can be named in multiple ways
        profiles.switchover = out?.switchover ?? out?.switchover_volumePercent ?? null
        // only set if any profile present
        if (profiles.injectionProfile || profiles.packingProfile || profiles.switchover !== null) {
          set((s: any) => ({ ...s, baselineProfiles: profiles }))
        }
      } catch (_e) {}

      // also update press/material selection in their stores (idempotent)
      try {
        const ps = usePressStore.getState()
        if (typeof ps.selectPress === 'function') ps.selectPress(c.pressId ?? null)
      } catch (_e) {}
      try {
        const ms = useMaterialStore.getState()
        if (typeof ms.selectMaterial === 'function') ms.selectMaterial(c.materialId ?? null)
      } catch (_e) {}
    } catch (_e) {}
  },
}))

// Orchestrazione sicura: sottoscrivi le store rilevanti e richiama `ricalcola` in modo
// debounced e idempotente quando gli input cambiano. Non eseguiamo la sottoscrizione
// durante SSR (controllo window) e la eseguiamo una sola volta.
if (typeof window !== 'undefined') {
  // On client start, seed result from localStorage lastCalcResult when available.
  try {
    const raw = window.localStorage.getItem('fm:lastCalcResult')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        ;(useParametriStore as any).setState({ lastCalcResult: parsed, result: parsed })
      } catch (_) {}
    }
  } catch (_) {}
  let orchestrationInitialized = (useParametriStore as any)._orchestrationInitialized
  if (!orchestrationInitialized) {
    ;(useParametriStore as any)._orchestrationInitialized = true

    let timer: ReturnType<typeof setTimeout> | null = null
    const debounceMs = 250

    function buildInputFromStores(): CalculationInput {
      const d = useDrawingStore.getState()
      const p = usePressStore.getState()
      const m = useMaterialStore.getState()
      const ds = useDefectsStore.getState()

      const pressEntry = p?.selectedPressId ? (p.catalog?.[p.selectedPressId] ?? null) : null
      const materialEntry = m?.selectedMaterialId ? (m.catalog?.[m.selectedMaterialId] ?? null) : null

      const baseInput: CalculationInput = {
        volumeCm3: d?.volumeCm3 ?? 0,
        shotVolumeCm3: undefined,
        press: pressEntry
          ? {
              id: p.selectedPressId,
              tonnellaggio: pressEntry.tonnellaggio,
              screwDiameters: pressEntry.screwDiameters || [],
              maxPressureBar: pressEntry.maxPressureBar,
              maxSpeedMmPerS: pressEntry.maxSpeedMmPerS,
            }
          : null,
        material: materialEntry
          ? {
              id: m.selectedMaterialId,
              densityGPerCm3: materialEntry.densityGPerCm3,
              recommendedTemperatureC: materialEntry.recommendedTemperatureC,
            }
          : null,
      }

      // Read defect selection and apply corrections (pure function)
      const defectsState: any = useDefectsStore.getState?.() ?? {}
      const defectId = mapLegacyDefectId(defectsState.selectedDefectId)
      const severity = mapLegacySeverity(defectsState.selectedSeverity)

      function applyDefectDeltaToInput(baseInput: any, delta: any) {
        if (!delta) return baseInput

        const next: any = { ...baseInput }

        next.injection = { ...(baseInput.injection ?? {}) }
        next.packing = { ...(baseInput.packing ?? {}) }
        next.temps = { ...(baseInput.temps ?? {}) }

        const pct = (v: number, p: number) => v * (1 + p / 100)

        if (typeof delta.injectionSpeed_pct === 'number' && typeof next.injection.speed === 'number') {
          next.injection.speed = pct(next.injection.speed, delta.injectionSpeed_pct)
        }
        if (typeof delta.injectionPressure_pct === 'number' && typeof next.injection.pressure === 'number') {
          next.injection.pressure = pct(next.injection.pressure, delta.injectionPressure_pct)
        }
        if (typeof delta.switchOver_pct === 'number' && typeof next.injection.switchover === 'number') {
          next.injection.switchover = pct(next.injection.switchover, delta.switchOver_pct)
        }

        if (typeof delta.packPressure_pct === 'number' && typeof next.packing.pressure === 'number') {
          next.packing.pressure = pct(next.packing.pressure, delta.packPressure_pct)
        }
        if (typeof delta.packTime_pct === 'number' && typeof next.packing.time === 'number') {
          next.packing.time = pct(next.packing.time, delta.packTime_pct)
        }

        if (typeof delta.meltTemp_C === 'number' && typeof next.temps.melt === 'number') {
          next.temps.melt = next.temps.melt + delta.meltTemp_C
        }
        if (typeof delta.moldTemp_C === 'number' && typeof next.temps.mold === 'number') {
          next.temps.mold = next.temps.mold + delta.moldTemp_C
        }

        if (typeof delta.backPressure_pct === 'number' && typeof next.plasticizing?.backPressure === 'number') {
          next.plasticizing = { ...(baseInput.plasticizing ?? {}) }
          next.plasticizing.backPressure = pct(next.plasticizing.backPressure, delta.backPressure_pct)
        }

        return next
      }

      let finalInput = baseInput as any
      if (defectId) {
        const fix = applyDefectFix(defectId, severity)
        const patched = applyDefectDeltaToInput(baseInput, fix.delta)
        // derive structured appliedCorrections by comparing baseInput -> patched
        const corrections: any[] = []
        try {
          const read = (obj: any, path: string[]) => path.reduce((a, p) => (a && a[p] !== undefined ? a[p] : undefined), obj)
          const candidates: string[][] = [
            ['injection','speed'], ['injection','pressure'], ['injection','switchover'],
            ['packing','pressure'], ['packing','time'], ['temps','melt'], ['temps','mold'], ['plasticizing','backPressure']
          ]
          for (const p of candidates) {
            const oldV = read(baseInput as any, p)
            const newV = read(patched as any, p)
            if (oldV !== undefined && newV !== undefined && oldV !== newV) {
              const field = p.join('.')
              const before = typeof oldV === 'number' ? oldV : undefined
              const after = typeof newV === 'number' ? newV : undefined
              const delta = typeof before === 'number' && typeof after === 'number' ? (after - before) : (typeof newV === 'number' && typeof oldV !== 'number' ? newV : undefined)
              corrections.push({
                id: `defect:${defectId}:${field}`,
                type: 'defect',
                target: field,
                action: typeof delta === 'number' ? (delta < 0 ? 'decrease' : (delta > 0 ? 'increase' : 'set')) : 'set',
                before,
                after,
                delta: typeof delta === 'number' ? delta : undefined,
                reason: `defect=${defectId}`,
                source: 'defectRules',
              })
            }
          }
        } catch (_) {
          // ignore
        }
        finalInput = patched
        try {
          const normalized = normalizeCorrections(corrections)
          // set lastDefectFix only if it changed (idempotent)
          try {
            const prev: any = (useParametriStore as any).getState?.().lastDefectFix ?? null
            const prevStr = prev ? JSON.stringify(prev) : null
            const next = { defectId, severity, delta: fix.delta ?? undefined, notes: fix.notes, appliedCorrections: normalized }
            const nextStr = JSON.stringify(next)
            if (prevStr !== nextStr) {
              ;(useParametriStore as any).setState({ lastDefectFix: next })
              // persist best-effort
              if (typeof window !== 'undefined' && window.localStorage) {
                try { window.localStorage.setItem('fm:lastDefectFix', JSON.stringify(next)) } catch (_) {}
              }
            }
          } catch (_) {
            ;(useParametriStore as any).setState({ lastDefectFix: { defectId, severity, delta: fix.delta ?? undefined, notes: fix.notes, appliedCorrections: normalized } })
          }
        } catch (_) {}
      }

      return finalInput as CalculationInput
    }

    function inputsEqual(a: CalculationInput | null, b: CalculationInput | null): boolean {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch (_) {
        return false
      }
    }

    async function scheduleRecalc() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        timer = null
        const input = buildInputFromStores()
        const current = useParametriStore.getState().lastInput
        if (inputsEqual(current, input)) return
        try {
          await useParametriStore.getState().ricalcola(input)
        } catch (e) {
          // swallow; ricalcola already sets error
        }
      }, debounceMs)
      try { (timer as any)?.unref?.(); } catch (_) {}
    }

    // Subscribe to stores; debounce guards against too-frequent calls
    useDrawingStore.subscribe(() => scheduleRecalc())
    usePressStore.subscribe(() => scheduleRecalc())
    useMaterialStore.subscribe(() => scheduleRecalc())
    // Recalculate when defect selection changes (guarded by existing prereqs inside scheduleRecalc)
    useDefectsStore.subscribe(() => scheduleRecalc())
  }
}

export default useParametriStore
