import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'
import { useDrawingStore } from '@/stores/drawingStore'
import FillSimulationViewer from '@/components/FillSimulationViewer'

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
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-800">Pressione (bar)</div>
            <div className="text-lg">{data.pressureBar ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-blue-800">Portata iniezione (cm³/s)</div>
            <div className="text-lg">{data.injectionFlowCm3s ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-blue-800">Commutazione V/P (cm³ iniettati)</div>
            <div className="text-lg">{data.vpSwitchVolumeCm3?.toFixed(2) ?? 'Non disponibile'} / {data.shotVolumeCm3?.toFixed(2) ?? '--'} cm³</div>
            {typeof data.vpSwitchPercentOfShot === 'number' && <div className="text-xs text-gray-600">{data.vpSwitchPercentOfShot.toFixed(1)}% della dose · tempo indicativo {data.switchoverMs ?? '--'} ms</div>}
            {data.vpSwitchVolumeCm3 == null && <div className="text-xs text-amber-700">Conferma volume del pezzo, numero di cavità e canali prima di usare V/P.</div>}
          </div>
          <div>
            <div className="text-sm text-blue-800">Tonnellaggio richiesto</div>
            <div className="text-lg">{data.tonnellaggioRequired ?? '--'} t</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-blue-800">Tempi (ms)</div>
            <div className="text-lg">Iniezione: {data.times?.injectionMs ?? '--'} — Raffreddamento: {data.times?.coolingMs ?? '--'}</div>
          </div>
        </div>
      )}

      {data && <div className="rounded border bg-blue-50 px-3 py-2 text-sm text-blue-900">Dose totale stampata: <strong>{typeof data.shotVolumeCm3 === 'number' ? `${data.shotVolumeCm3.toFixed(2)} cm³` : 'dato non disponibile'}</strong></div>}
      {data && viewerUrl && <FillSimulationViewer viewerUrl={viewerUrl} durationMs={Math.max(1200, data.times?.injectionMs ?? 3000)} />}

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
