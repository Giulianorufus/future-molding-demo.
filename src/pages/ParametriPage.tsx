import { useParametriStore } from "../stores/parametriStore";
import ProcessProfilesPanel from "../components/ProcessProfilesPanel";
import type { CalculationResultWithProfiles } from "../engine/calcEngine";

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
    </div>
  );
}

