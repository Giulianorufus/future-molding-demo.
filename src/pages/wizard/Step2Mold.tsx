import React from 'react'
import { useDrawingStore } from '@/stores/drawingStore'

export default function Step2Mold({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const cavityCount = useDrawingStore((s) => s.cavityCount)
  const cavityCountConfirmed = useDrawingStore((s) => s.cavityCountConfirmed)
  const feedSystem = useDrawingStore((s) => s.feedSystem)
  const runnerVolumeCm3 = useDrawingStore((s) => s.runnerVolumeCm3)
  const runnerProjectedAreaCm2 = useDrawingStore((s) => s.runnerProjectedAreaCm2)
  const partVolume = useDrawingStore((s) => s.volumeCm3)
  const partProjectedArea = useDrawingStore((s) => s.surfaceCm2)
  const setResult = useDrawingStore((s) => s.setResult)

  const totalPartVolume = (partVolume ?? 0) * cavityCount
  const totalProjectedArea = (partProjectedArea ?? 0) * cavityCount + (runnerProjectedAreaCm2 ?? 0)
  const totalShotVolume = totalPartVolume + (feedSystem === 'cold' ? (runnerVolumeCm3 ?? 0) : 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-blue-800">Configurazione stampo</h2>
        <p className="text-sm text-gray-600">Il CAD descrive il singolo pezzo. Conferma qui i dati dello stampo prima di scegliere la pressa.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-800 mb-2">Numero cavità</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 4, 8].map((n) => (
            <button key={n} type="button" className={`px-4 py-2 border rounded ${cavityCount === n ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => setResult({ cavityCount: n, cavityCountConfirmed: true })}>{n}</button>
          ))}
          <input type="number" min={1} step={1} value={cavityCount}
            onChange={(e) => setResult({ cavityCount: Math.max(1, Math.floor(Number(e.target.value) || 1)), cavityCountConfirmed: true })}
            className="w-24 px-3 py-2 border rounded" aria-label="Altro numero cavità" />
        </div>
        {!cavityCountConfirmed && <div className="mt-2 text-sm text-amber-700">1 cavità è il valore iniziale e deve essere confermato.</div>}
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-800 mb-2">Sistema di alimentazione</label>
        <select value={feedSystem} onChange={(e) => setResult({ feedSystem: e.target.value as 'unknown' | 'hot' | 'cold' })}
          className="w-full max-w-sm px-3 py-2 border rounded">
          <option value="unknown">Non noto</option>
          <option value="hot">Canale caldo</option>
          <option value="cold">Canale freddo</option>
        </select>
      </div>

      {feedSystem === 'cold' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Volume materozza/canali per stampata (cm³)
            <input type="number" min={0} step="0.1" value={runnerVolumeCm3 ?? ''}
              onChange={(e) => setResult({ runnerVolumeCm3: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
              className="block mt-1 w-full px-3 py-2 border rounded" />
          </label>
          <label className="text-sm">Area proiettata canali (cm²)
            <input type="number" min={0} step="0.1" value={runnerProjectedAreaCm2 ?? ''}
              onChange={(e) => setResult({ runnerProjectedAreaCm2: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
              className="block mt-1 w-full px-3 py-2 border rounded" />
          </label>
        </div>
      )}

      <div className="bg-gray-50 border rounded p-3 text-sm">
        <div>Volume pezzi/stampata: <strong>{totalPartVolume.toFixed(2)} cm³</strong></div>
        <div>Volume totale noto: <strong>{totalShotVolume.toFixed(2)} cm³</strong></div>
        <div>Area proiettata totale nota: <strong>{totalProjectedArea.toFixed(2)} cm²</strong></div>
        {(feedSystem === 'unknown' || !cavityCountConfirmed) && <div className="mt-2 text-amber-700">Configurazione non completamente confermata: dose e forza di chiusura saranno considerate provvisorie.</div>}
      </div>

      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-100 border rounded" onClick={onBack}>Indietro</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onNext}>Avanti</button>
      </div>
    </div>
  )
}
