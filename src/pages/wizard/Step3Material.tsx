import React from 'react'
import { useMaterialStore } from '@/stores/materialStore'
import { materialCatalog } from '@/data/materialCatalog'
import { materialLibrary } from '@/data/materialLibrary'

export default function Step3Material({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { catalog, selectedMaterialId, setCatalog, selectMaterial } = useMaterialStore()
  // ensure catalog is populated when wizard step mounts
  React.useEffect(() => {
    if (!catalog || Object.keys(catalog).length === 0) {
      // convert array catalog to record by id if needed
      try {
        const asRecord = (materialCatalog || []).reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
        setCatalog(asRecord)
      } catch (err) {
        // ignore
      }
    }
  }, [catalog, setCatalog])
  const materials = Object.values(catalog || {})

  const canNext = !!selectedMaterialId

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-blue-800 font-semibold mb-2">Seleziona Materiale</div>
        <div className="grid grid-cols-2 gap-2">
          {materials.length === 0 ? (
            <div className="text-sm text-gray-500">Nessun materiale disponibile</div>
          ) : materials.map((m: any) => {
            const density = materialLibrary.byId(m.id)?.density_g_cm3
            return (
              <button key={m.id} className={`p-3 border rounded text-left ${selectedMaterialId === m.id ? 'border-blue-700 bg-blue-50' : 'bg-white'}`} onClick={() => selectMaterial(m.id)}>
                <div className="font-medium text-blue-800">{m.name}</div>
                <div className="text-sm text-gray-600">Densità: {density?.toFixed(3) ?? '--'} g/cm³</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
        <button className={`px-4 py-2 rounded text-white ${canNext ? 'bg-blue-600' : 'bg-yellow-400 text-black'}`} onClick={() => { if (canNext && onNext) onNext() }} disabled={!canNext}>Avanti</button>
      </div>
    </div>
  )
}
