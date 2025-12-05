import React from "react";
import { useDrawingStore } from "@/stores/drawingStore";
import { useParametriStore as useParamsStore } from "@/stores/parametriStore";

export default function Difetti() {
  // Drawing store (nuovo flusso)
  const drawing = useDrawingStore((s) => ({
    glbUrl: s.glbUrl,
    previewUrl: s.previewUrl,
    volumeCm3: s.volumeCm3,
    surfaceCm2: s.surfaceCm2,
    boundingBox: s.boundingBox,
    isLoading: s.isLoading,
    error: s.error,
  }));

  // Parametri store
  const params = useParamsStore((s) => s.result);

  // Determina l’URL del modello
  const modelUrl = drawing.glbUrl || drawing.previewUrl || null;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">DIAGNOSTICA DIFETTI</h1>

      {/* DRAWING STORE */}
      <div className="p-4 bg-yellow-100 border-2 border-yellow-600 rounded">
        <h2 className="font-semibold mb-2 text-lg">drawingStore</h2>
        <pre className="text-xs bg-white p-2 border rounded overflow-auto max-h-80">
{JSON.stringify(drawing, null, 2)}
        </pre>
      </div>

      {/* PARAMS STORE */}
      <div className="p-4 bg-blue-100 border-2 border-blue-600 rounded">
        <h2 className="font-semibold mb-2 text-lg">paramsStore</h2>
        <pre className="text-xs bg-white p-2 border rounded overflow-auto max-h-80">
{JSON.stringify(params, null, 2)}
        </pre>
      </div>

      {/* MODEL URL RISOLTO */}
      <div className="p-4 bg-green-100 border-2 border-green-600 rounded">
        <h2 className="font-semibold mb-2 text-lg">modelUrl RISOLTO</h2>
        <p className="font-mono text-sm">
          {modelUrl ? modelUrl : "NULL"}
        </p>
      </div>

      {/* ERRORI */}
      {drawing.error && (
        <div className="p-4 bg-red-100 border-2 border-red-600 rounded">
          <h2 className="font-semibold mb-2 text-lg">ERRORE STORE</h2>
          <p>{drawing.error}</p>
        </div>
      )}
    </div>
  );
}
