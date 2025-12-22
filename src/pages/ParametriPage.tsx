import { useParametriStore } from "../stores/parametriStore";
import ProcessProfilesPanel from "../components/ProcessProfilesPanel";
import SimilarCasesPanel from "../components/SimilarCasesPanel";
import { buildRecipeSnapshot } from "../engine/recipeExport/buildRecipeSnapshot";
import { useCaseStore } from "../stores/caseStore";
import type { CalculationResultWithProfiles } from "../engine/calcEngine";
import type { CaseRecord } from "../engine/caseBased/caseTypes";

export default function ParametriPage() {
  const result = useParametriStore((s) => s.result);
  const loading = useParametriStore((s) => s.loading);
  const error = useParametriStore((s) => s.error);
  // cast as the extended CalculationResult that may contain optional profiles
  const _res = result as unknown as CalculationResultWithProfiles;
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
        </div>
      )}
      <ProcessProfilesPanel result={result} />

      {/* Similar cases: minimal dev seed + panel */}
      {/* Similar cases panel - build a best-effort snapshot from available data */}
      <SimilarCasesPanel snapshot={buildRecipeSnapshot({ projectName: null, input: {}, output: {} })} />

      {/* DEV-only seeding: lightweight, does not depend on result typings */}
      {import.meta.env.DEV && (() => {
        const { bulkAddCases, cases } = useCaseStore((s) => ({ bulkAddCases: s.bulkAddCases, cases: s.cases }));
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
              recipeSnapshot: buildRecipeSnapshot({ projectName: "dev", input: {}, output: {} }),
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
              recipeSnapshot: buildRecipeSnapshot({ projectName: "dev2", input: {}, output: {} }),
              outcome: { producedQty: 500, scrapQty: 25, scrapRate_pct: 5 },
            },
          ];
          try {
            bulkAddCases(seed);
          } catch (_) {}
        }
        return null;
      })()}
    </div>
  );
}

