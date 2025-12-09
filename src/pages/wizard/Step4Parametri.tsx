import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'

export default function Step4Parametri({ onBack }: { onBack?: () => void }) {
  const result = useParametriStore((s) => s.result)
  const loading = useParametriStore((s) => s.loading)
  const data = result

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

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
