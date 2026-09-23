import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'
import { useDrawingStore } from '@/stores/drawingStore'
import FillSimulationViewer from '@/components/FillSimulationViewer'
import OperatorRecipePanel from '@/components/OperatorRecipePanel'

export default function Step4Parametri({ onBack }: { onBack?: () => void }) {
  const result = useParametriStore((s) => s.result)
  const loading = useParametriStore((s) => s.loading)
  const data = result
  const viewerUrl = useDrawingStore((s) => s.viewerUrl)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-blue-800 font-semibold">Parametri calcolati</h2>
      {loading ? (
        <div>Calcolo in corso...</div>
      ) : !data ? (
        <div className="text-sm text-gray-500">Nessun risultato disponibile. Assicurati di aver caricato il disegno e selezionato pressa/materiale.</div>
      ) : <OperatorRecipePanel result={data} />}

      {data && <div className="rounded border bg-blue-50 px-3 py-2 text-sm text-blue-900">Forza di chiusura richiesta: <strong>{data.tonnellaggioRequired} t</strong> · Tempo iniezione indicativo: <strong>{(data.times.injectionMs / 1000).toFixed(2)} s</strong></div>}
      {data && viewerUrl && <FillSimulationViewer viewerUrl={viewerUrl} durationMs={Math.max(1200, data.times?.injectionMs ?? 3000)} />}

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
