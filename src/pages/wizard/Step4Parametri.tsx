import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'
import { useDrawingStore } from '@/stores/drawingStore'
import FillSimulationViewer from '@/components/FillSimulationViewer'

export default function Step4Parametri({ onBack }: { onBack?: () => void }) {
  const result = useParametriStore((s) => s.result)
  const loading = useParametriStore((s) => s.loading)
  const data = result
  const viewerUrl = useDrawingStore((s) => s.viewerUrl)
  const shotVolumeCm3 = useDrawingStore((s: any) => {
    const cavities = Math.max(1, Math.floor(Number(s.cavityCount) || 1))
    const runner = s.feedSystem === 'cold' ? Math.max(0, Number(s.runnerVolumeCm3) || 0) : 0
    return (Number(s.volumeCm3) || 0) * cavities + runner
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-blue-800 font-semibold">Parametri calcolati</h2>
      {loading ? (
        <div>Calcolo in corso...</div>
      ) : !data ? (
        <div className="text-sm text-gray-500">Nessun risultato disponibile. Assicurati di aver caricato il disegno e selezionato pressa/materiale.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-800">Pressione (bar)</div>
            <div className="text-lg">{data.pressureBar ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-blue-800">Velocità (mm/s)</div>
            <div className="text-lg">{data.velocityMmPerS ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-blue-800">Switchover (ms)</div>
            <div className="text-lg">{data.switchoverMs ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-blue-800">Tonnellaggio richiesto</div>
            <div className="text-lg">{data.tonnellaggioRequired ?? '--'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-blue-800">Tempi (ms)</div>
            <div className="text-lg">Iniezione: {data.times?.injectionMs ?? '--'} — Raffreddamento: {data.times?.coolingMs ?? '--'}</div>
          </div>
        </div>
      )}

      {data && <div className="rounded border bg-blue-50 px-3 py-2 text-sm text-blue-900">Dose totale stampata: <strong>{shotVolumeCm3.toFixed(2)} cm³</strong></div>}
      {data && viewerUrl && <FillSimulationViewer viewerUrl={viewerUrl} durationMs={Math.max(1200, data.times?.injectionMs ?? 3000)} />}

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
