import { useParametriStore } from "../stores/parametriStore";
import ProcessProfilesPanel from "../components/ProcessProfilesPanel";
import SimilarCasesPanel from "../components/SimilarCasesPanel";
import { buildRecipeSnapshot } from "../engine/recipeExport/buildRecipeSnapshot";
import { useCaseStore } from "../stores/caseStore";
import { useEffect } from "react";
import type { CalculationResultWithProfiles } from "../engine/calcEngine";
import type { CaseRecord } from "../engine/caseBased/caseTypes";

export default function ParametriPage() {
  const result = useParametriStore((s) => s.result);
  const loading = useParametriStore((s) => s.loading);
  const error = useParametriStore((s) => s.error);
  // cast as the extended CalculationResult that may contain optional profiles
  const _res = result as unknown as CalculationResultWithProfiles;
  const baselineProfiles = useParametriStore((s) => (s as any).baselineProfiles);
  const gateFreeze = useParametriStore((s) => (s as any).gateFreezeRecommendation);
  const gateFreezeApplied = useParametriStore((s) => (s as any).gateFreezeApplied);
  const applyGateFreezeIfEligible = useParametriStore((s) => (s as any).applyGateFreezeIfEligible);
  const revertGateFreeze = useParametriStore((s) => (s as any).revertGateFreeze);
  if (import.meta.env.DEV) {
    console.log("profiles", {
      inj: _res?.injectionProfile?.steps?.length ?? 0,
      pack: _res?.packingProfile?.steps?.length ?? 0,
      sw: _res?.switchover ?? _res?.switchover_volumePercent ?? null,
    });
  }

  // Debug helper: if result is not available yet, try to read cached last result from localStorage
  // and print its profiles so we can debug wiring without performing full UI actions.
  if (typeof window !== 'undefined' && !result) {
    try {
      const raw = window.localStorage.getItem('fm:lastCalcResult')
      if (raw) {
        const parsed = JSON.parse(raw)
        const _p = parsed as CalculationResultWithProfiles;
        if (import.meta.env.DEV) {
          console.log('profiles', {
            inj: _p?.injectionProfile?.steps?.length ?? 0,
            pack: _p?.packingProfile?.steps?.length ?? 0,
            sw: _p?.switchover ?? _p?.switchover_volumePercent ?? null,
          })
        }
      }
    } catch (_) {}
  }

  // read cases to prefer an imported case snapshot when available
  const cases = useCaseStore((s) => s.cases);
  const bulkAddCases = useCaseStore((s) => s.bulkAddCases);

  useEffect(() => {
    // DEV seeding is now opt-in via VITE_ENABLE_DEV_SIMILAR_CASES=1
    const enableDevSeed = (import.meta as any).env?.VITE_ENABLE_DEV_SIMILAR_CASES === '1';
    if (!enableDevSeed) return;
    if (cases.length === 0) {
      const now = new Date().toISOString();
      const seed: CaseRecord[] = [
        {
          id: "devcase-1-0001",
          createdAt: now,
          recipeFingerprint: "dev-fp-1",
          materialId: "DEV_MAT",
          pressId: "DEV_PRESS",
          screwDiameter_mm: 20,
          geometryHash: undefined,
          projectedArea_cm2: undefined,
          shotVolume_cm3: undefined,
              recipeSnapshot: buildRecipeSnapshot({ projectName: "dev", input: {}, output: {}, appVersion: (import.meta as any).env?.VITE_APP_VERSION ?? "dev" }),
          outcome: { producedQty: 1000, scrapQty: 10, scrapRate_pct: 1 },
        },
        {
          id: "devcase-2-0002",
          createdAt: now,
          recipeFingerprint: "dev-fp-2",
          materialId: "DEV_MAT",
          pressId: "DEV_PRESS",
          screwDiameter_mm: 20,
          geometryHash: undefined,
          projectedArea_cm2: undefined,
          shotVolume_cm3: undefined,
              recipeSnapshot: buildRecipeSnapshot({ projectName: "dev2", input: {}, output: {}, appVersion: (import.meta as any).env?.VITE_APP_VERSION ?? "dev" }),
          outcome: { producedQty: 500, scrapQty: 25, scrapRate_pct: 5 },
        },
      ];
      try {
        bulkAddCases(seed);
      } catch (_) {}
    }
  }, [cases.length, bulkAddCases]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Sintesi calcolo</h1>

      {/* Stato: nessun calcolo ancora fatto */}
      {!result && !loading && !error && (
        <p className="text-gray-600 text-lg">
          Nessun calcolo disponibile. Completa il wizard.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-blue-600 text-lg">Calcolo in corso...</p>
      )}

      {/* Errore */}
      {error && (
        <p className="text-red-600 text-lg">
          Errore durante il calcolo: {String(error)}
        </p>
      )}

      {/* Risultato */}
      {result && (
        <div className="bg-white p-6 shadow rounded max-w-3xl">
          <table className="w-full text-lg">
            <tbody>
              <tr className="border-b">
                <td className="py-3 font-semibold">Tonnellaggio richiesto</td>
                <td className="py-3 text-right">
                  {result.tonnellaggioRequired} kN
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Pressione stimata</td>
                <td className="py-3 text-right">
                  {result.pressureBar} bar
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Diametro vite</td>
                <td className="py-3 text-right">
                  {result.screwDiameterMm} mm
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Velocità (vite)</td>
                <td className="py-3 text-right">
                  {result.velocityMmPerS} mm/s
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Switchover</td>
                <td className="py-3 text-right">
                  {result.switchoverMs} ms
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Injection time</td>
                <td className="py-3 text-right">
                  {result.times?.injectionMs ?? 0} ms
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 font-semibold">Cooling time</td>
                <td className="py-3 text-right">
                  {result.times?.coolingMs ?? 0} ms
                </td>
              </tr>

              <tr>
                <td className="py-3 font-semibold">Temp. suggerita (raff.)</td>
                <td className="py-3 text-right">
                  {result.cooling?.suggestedC ?? "--"} °C
                </td>
              </tr>
            </tbody>
          </table>

          {/* Gate Freeze recommendation (minimal, read-only suggestion) */}
          <div className="mt-4">
            <h3 className="font-semibold">Gate Freeze</h3>
            {gateFreeze ? (
              <div className="text-sm text-gray-800 mt-1">
                {gateFreezeApplied ? (
                  <div>
                    <div>Applicato: <strong>{gateFreeze.recommended_hold_s} s</strong></div>
                    <div className="mt-2">
                      <button type="button" onClick={() => revertGateFreeze()} className="px-2 py-1 bg-gray-200 rounded text-sm">Ripristina</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    Holding consigliato (Gate Freeze): <strong>{gateFreeze.recommended_hold_s} s</strong>
                    {gateFreeze.confidence != null && (
                      <> (conf {gateFreeze.confidence})</>
                    )}
                    {gateFreeze.points != null && (
                      <> — punti {gateFreeze.points}</>
                    )}
                    {gateFreeze.reason && <div className="text-xs text-gray-500">Motivo: {gateFreeze.reason}</div>}
                    <div className="mt-2">
                      <button type="button" onClick={() => applyGateFreezeIfEligible(gateFreeze)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Applica</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-1">Nessuna raccomandazione disponibile per questo fingerprint</div>
            )}
          </div>
        </div>
      )}
      {/* Baseline profiles banner */}
      {baselineProfiles && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Baseline profili applicata:</strong>
          <div className="mt-1">Injection steps: {baselineProfiles.injectionProfile ? baselineProfiles.injectionProfile.length : 0}</div>
          <div>Switchover: {baselineProfiles.switchover != null ? `${baselineProfiles.switchover}%` : '—'}</div>
        </div>
      )}
      <ProcessProfilesPanel result={result} />

      {/* Similar cases: minimal dev seed + panel */}
      {/* Similar cases panel - prefer a snapshot from an imported case when available so imported cases surface automatically */}
      {
        (() => {
          const snapshot = cases && cases.length > 0
            ? cases[0].recipeSnapshot
            : buildRecipeSnapshot({ projectName: null, input: {}, output: {}, appVersion: (import.meta as any).env?.VITE_APP_VERSION ?? "dev" });
          return (
            <>
              <SimilarCasesPanel snapshot={snapshot} />
              <div data-testid="case-count" className="mt-2 text-sm text-gray-500">Cases: {cases.length}</div>
            </>
          );
        })()
      }

      {/* DEV-only seeding handled in effect above */}
    </div>
  );
}

