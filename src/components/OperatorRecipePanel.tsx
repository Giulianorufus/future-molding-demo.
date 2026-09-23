import type { CalculationResult } from '../core/calcEngine'
import type { InjectionStep, PackingStep } from '../engine/profiles/profileTypes'

type EngineOutput = {
  injectionProfile?: InjectionStep[]
  packingProfile?: PackingStep[] | { steps: PackingStep[] }
  velIniezione?: number
  contropressione?: number
  velocitaVite?: number
  packTempo?: number
  coolingTime?: number
  suggerimenti?: string[]
}

const value = (n: number | null | undefined, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('it-IT', { maximumFractionDigits: digits }) : '—'

export default function OperatorRecipePanel({ result }: { result: CalculationResult }) {
  const output = result.unified as EngineOutput | undefined
  const injection = output?.injectionProfile ?? []
  const appliedPacking = (result as CalculationResult & { packingProfile?: { steps: PackingStep[] } }).packingProfile
  const packing = appliedPacking?.steps ?? (Array.isArray(output?.packingProfile)
    ? output.packingProfile
    : output?.packingProfile?.steps ?? [])

  return (
    <section aria-labelledby="operator-recipe-heading" className="rounded-lg border border-blue-200 bg-white p-4 sm:p-6 space-y-5">
      <div>
        <h2 id="operator-recipe-heading" className="text-xl font-bold text-[#003366]">Ricetta iniziale · lettura operatore</h2>
        <p className="text-sm text-slate-600">Valori calcolati, da verificare sullo stampo e sulla pressa prima dell’avvio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-label="Dosaggio" className="rounded border p-4">
          <h3 className="font-semibold text-[#003366]">1. Dosaggio</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4"><dt>Volume stampata calcolato</dt><dd className="font-semibold">{value(result.shotVolumeCm3)} cm³</dd></div>
            <div className="flex justify-between gap-4"><dt>Giri vite</dt><dd>{value(output?.velocitaVite, 0)} giri/min</dd></div>
            <div className="flex justify-between gap-4"><dt>Contropressione</dt><dd>{value(output?.contropressione, 0)} bar</dd></div>
          </dl>
          <p className="mt-2 text-xs text-slate-600">Dose macchina e cuscino richiedono una verifica sulla vite selezionata.</p>
        </section>

        <section aria-label="Iniezione e commutazione" className="rounded border p-4">
          <h3 className="font-semibold text-[#003366]">2. Iniezione e commutazione V/P</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4"><dt>Portata di riferimento</dt><dd className="font-semibold">{value(output?.velIniezione ?? result.velocityMmPerS, 1)} cm³/s</dd></div>
            <div className="flex justify-between gap-4"><dt>Pressione stimata</dt><dd>{value(result.pressureBar, 0)} bar</dd></div>
            <div className="flex justify-between gap-4"><dt>Volume iniettato a V/P</dt><dd className="font-semibold">{value(result.vpSwitchVolumeCm3)} cm³</dd></div>
            {result.vpSwitchPercentOfShot != null && <div className="flex justify-between gap-4"><dt>Quota della stampata</dt><dd>{value(result.vpSwitchPercentOfShot, 1)}%</dd></div>}
          </dl>
          <p className="mt-2 text-xs text-amber-800">Sulla pressa il punto V/P può essere espresso come volume residuo della vite. Il volume iniettato qui indicato non è un’impostazione da copiare in quel campo.</p>
          {injection.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="text-left font-medium">Profilo di iniezione</caption>
                <thead><tr className="border-b"><th scope="col" className="py-1">Fase</th><th scope="col">Portata</th><th scope="col">Fine fase</th></tr></thead>
                <tbody>{injection.map((step) => <tr key={step.step} className="border-b last:border-0"><th scope="row" className="py-1">{step.step}</th><td>{value(step.speed_cm3_s, 1)} cm³/s</td><td>{step.endBy.kind === 'volumePercent' ? `${value(step.endBy.value, 1)}% stampata` : `${value(step.endBy.value)} s`}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label="Postpressione" className="rounded border p-4">
          <h3 className="font-semibold text-[#003366]">3. Postpressione</h3>
          {packing.length > 0 ? (
            <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th scope="col" className="py-1">Fase</th><th scope="col">Pressione</th><th scope="col">Tempo</th></tr></thead><tbody>{packing.map((step) => <tr key={step.step} className="border-b last:border-0"><th scope="row" className="py-1">{step.step}</th><td>{value(step.pressure_bar, 0)} bar</td><td>{value(step.time_s)} s</td></tr>)}</tbody></table></div>
          ) : <p className="mt-2 text-sm text-slate-600">Profilo a fasi non disponibile. Tempo indicativo: {value(output?.packTempo)} s.</p>}
        </section>

        <section aria-label="Raffreddamento e decompressione" className="rounded border p-4">
          <h3 className="font-semibold text-[#003366]">4. Raffreddamento e decompressione</h3>
          <p className="mt-2 text-sm">Raffreddamento stimato: <strong>{value(output?.coolingTime)} s</strong></p>
          <p className="mt-2 text-sm text-slate-600">Decompressione: nessun valore calcolato. Definirla in base a materiale, ugello e comportamento dello stampo.</p>
        </section>
      </div>
      {output?.suggerimenti && output.suggerimenti.length > 0 && <div role="note" className="rounded bg-amber-50 p-3 text-sm text-amber-900"><strong>Verifiche:</strong><ul className="ml-5 list-disc">{output.suggerimenti.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
    </section>
  )
}
