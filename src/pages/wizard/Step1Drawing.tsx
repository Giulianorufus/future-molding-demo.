import React from 'react'
import { useDrawingStore } from '@/stores/drawingStore'
import { useDrawingUpload } from '@/hooks/useDrawingUpload'

export default function Step1Drawing({ onNext }: { onNext?: () => void }) {
  const { handleUpload, isUploading } = useDrawingUpload()
  const { volumeCm3, surfaceCm2, boundingBox, previewUrl, isLoading } = useDrawingStore((s) => ({ volumeCm3: s.volumeCm3, surfaceCm2: s.surfaceCm2, boundingBox: s.boundingBox, previewUrl: s.previewUrl, isLoading: s.isLoading }))

  const canNext = typeof volumeCm3 === 'number' && volumeCm3 > 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-blue-800 font-semibold mb-2">Carica file STEP/GLB</label>
        <input
          type="file"
          accept=".step,.stp,.glb,.gltf,.stl"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            await handleUpload(f)
          }}
          className=""
          disabled={isUploading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-blue-800 font-medium">Volume (cm³)</div>
          <div className="text-lg">{volumeCm3 ?? '--'}</div>
        </div>
        <div>
          <div className="text-sm text-blue-800 font-medium">Superficie proiettata (cm²)</div>
          <div className="text-lg">{surfaceCm2 ?? '--'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-blue-800 font-medium">Bounding Box</div>
          <div className="text-lg">{boundingBox ? `${boundingBox.x} x ${boundingBox.y} x ${boundingBox.z} mm` : '--'}</div>
        </div>
      </div>

      <div>
        <div className="text-sm text-blue-800 font-medium mb-2">Anteprima</div>
        {previewUrl ? (
          <div className="w-full h-60 bg-gray-100 border rounded flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-700 mb-2">Anteprima 3D</div>
              <a className="text-blue-700 underline" href={previewUrl} target="_blank" rel="noreferrer">Apri anteprima in nuova scheda</a>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Nessuna anteprima disponibile</div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          className={`px-4 py-2 rounded text-white ${canNext ? 'bg-blue-600' : 'bg-yellow-400 text-black'}`}
          onClick={() => { if (canNext && onNext) onNext() }}
          disabled={!canNext}
        >
          Avanti
        </button>
      </div>
    </div>
  )
}
