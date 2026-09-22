import React from 'react'
import { useDrawingStore } from '@/stores/drawingStore'
import { useDrawingUpload } from '@/hooks/useDrawingUpload'
import ThreeViewer from '@/components/ThreeViewer'

export default function Step1Drawing({ onNext }: { onNext?: () => void }) {
  const { handleUpload, isUploading } = useDrawingUpload()
  const volumeCm3 = useDrawingStore((s) => s.volumeCm3)
  const surfaceCm2 = useDrawingStore((s) => s.surfaceCm2)
  const boundingBox = useDrawingStore((s) => s.boundingBox)
  const previewUrl = useDrawingStore((s) => s.previewUrl)
  const viewerUrl = useDrawingStore((s) => s.viewerUrl ?? s.glbUrl)
  const conversionStatus = useDrawingStore((s) => s.conversionStatus)
  const conversionMessage = useDrawingStore((s) => s.conversionMessage)
  const isLoading = useDrawingStore((s) => s.isLoading)

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
        {viewerUrl ? (
          <ThreeViewer viewerUrl={viewerUrl} />
        ) : previewUrl ? (
          <div className="w-full h-60 bg-gray-100 border rounded flex items-center justify-center">
            <img src={previewUrl} alt="Anteprima disegno" className="max-w-full max-h-full object-contain" />
          </div>
        ) : conversionStatus === 'converting' || isLoading ? (
          <div className="text-sm text-gray-500">Conversione 3D in corso…</div>
        ) : (
          <div className="text-sm text-gray-500">{conversionMessage ?? 'Nessuna anteprima disponibile'}</div>
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
