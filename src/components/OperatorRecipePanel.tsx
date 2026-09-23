import type { CalculationResult } from '../core/calcEngine'
import { buildOperatorRecipeView } from './operatorRecipe/buildOperatorRecipeView'

type OperatorRecipePanelProps = {
  result: CalculationResult
}

const numberFormatter = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 })
const volumeFormatter = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 6 })

function show(value: number | null, unit: string): string {
  return value === null ? 'Dato non disponibile' : numberFormatter.format(value) + ' ' + unit
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight
      ? 'rounded-xl border border-yellow-400 bg-yellow-50 p-4'
      : 'rounded-xl border border-blue-100 bg-white p-4'}>
      <dt className="text-sm font-medium text-blue-800">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-blue-950 break-words">{value}</dd>
    </div>
  )
}

export default function OperatorRecipePanel({ result }: OperatorRecipePanelProps) {
  const recipe = buildOperatorRecipeView(result)
  const dose = recipe.shotVolumeCm3 === null
    ? 'Dato non disponibile'
    : volumeFormatter.format(recipe.shotVolumeCm3) + ' cm³'
  const vp = recipe.vpVolumeCm3 === null
    ? 'Da confermare: geometria, cavità e canali'
    : volumeFormatter.format(recipe.vpVolumeCm3) + ' cm³ iniettati'

  return (
    <section aria-label="Ricetta iniziale operatore" className="space-y-4 text-blue-950">
      <div className="rounded-xl bg-blue-950 p-4 text-white">
        <h2 className="text-xl font-semibold">Ricetta iniziale · vista operatore</h2>
        <p className="mt-1 text-sm text-blue-100">Valori suggeriti da verificare sulla pressa e sul pezzo.</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Volume dosaggio · dose totale" value={dose} highlight />
        <Metric label="Commutazione V/P · volume iniettato" value={vp} highlight />
      </dl>
      {recipe.vpVolumeCm3 !== null && (
        <p className="text-sm text-blue-800">
          {recipe.vpPercentOfShot !== null && numberFormatter.format(recipe.vpPercentOfShot) + '% della dose'}
          {recipe.vpTimeMs !== null && ' · tempo indicativo ' + numberFormatter.format(recipe.vpTimeMs) + ' ms'}
        </p>
      )}

      <section aria-label="Iniezione" className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-lg font-semibold">Iniezione</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Metric label="Portata suggerita" value={show(recipe.injectionFlowCm3s, 'cm³/s')} />
          <Metric label="Pressione stimata" value={show(recipe.injectionPressureBar, 'bar')} />
        </dl>
        <h4 className="mt-4 text-sm font-semibold">Fasi di riempimento</h4>
        {recipe.injectionPhases.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead><tr className="border-b border-blue-300">
                <th scope="col" className="p-2">Fase</th>
                <th scope="col" className="p-2">Portata</th>
                <th scope="col" className="p-2">Fine fase</th>
              </tr></thead>
              <tbody>
                {recipe.injectionPhases.map((phase) => (
                  <tr key={phase.step} className="border-b border-blue-200">
                    <td className="p-2 font-semibold">{phase.step}</td>
                    <td className="p-2">{numberFormatter.format(phase.flowCm3s)} cm³/s</td>
                    <td className="p-2">{phase.endPercentOfShot === null
                      ? 'Da confermare'
                      : numberFormatter.format(phase.endPercentOfShot) + '% della dose'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm text-blue-800">Profilo non disponibile.</p>}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="Postpressione" className="rounded-xl border border-blue-200 p-4">
          <h3 className="text-lg font-semibold">Postpressione</h3>
          <p className="mt-1 text-xs text-blue-700">Stima complessiva; fasi non disponibili.</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Pressione" value={show(recipe.holdingPressureBar, 'bar')} />
            <Metric label="Tempo" value={show(recipe.holdingTimeSec, 's')} />
          </dl>
        </section>
        <section aria-label="Dosaggio e decompressione" className="rounded-xl border border-blue-200 p-4">
          <h3 className="text-lg font-semibold">Dosaggio e decompressione</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Rotazione vite" value={show(recipe.screwRpm, 'giri/min')} />
            <Metric label="Tempo plastificazione" value={show(recipe.plastificationTimeSec, 's')} />
            <Metric label="Contropressione" value={show(recipe.backPressureBar, 'bar')} />
            <Metric label="Decompressione" value="Da impostare in pressa" />
          </dl>
        </section>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Raffreddamento indicativo" value={show(recipe.coolingTimeMs, 'ms')} />
        <Metric label="Chiusura richiesta" value={show(recipe.requiredClampTon, 't')} />
        <Metric label="Diametro vite" value={show(recipe.screwDiameterMm, 'mm')} />
      </dl>
    </section>
  )
}
