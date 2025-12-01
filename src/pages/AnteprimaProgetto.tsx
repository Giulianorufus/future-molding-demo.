import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { addDrawing, loadDrawings, type DrawingMeta } from "@/services/storage";
import { saveDrawingFile } from "@/services/db";
import DrawingPreview from "@/components/Parametri/DrawingPreview";

export default function AnteprimaProgetto() {
  const [drawings, setDrawings] = useState<DrawingMeta[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDrawings(loadDrawings());
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = addDrawing({ name: file.name, size: file.size, type: file.type });
      await saveDrawingFile(meta.id, file);
      setDrawings((prev) => [meta, ...prev]);
      setSelectedDrawingId(meta.id);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Anteprima Progetto</h1>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium">Disegno</label>
            <div className="flex gap-2">
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedDrawingId}
                onChange={(e) => setSelectedDrawingId(e.target.value)}
              >
                <option value="">Seleziona un disegno</option>
                {drawings.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input ref={fileInputRef} type="file" accept=".stl,.glb,.gltf,.obj,.pdf" className="hidden" onChange={handleUpload} />
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>Carica disegno</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Anteprima */}
        {selectedDrawingId ? (
          <DrawingPreview drawingId={selectedDrawingId} />
        ) : (
          <div className="border rounded p-3 text-sm text-gray-600">Seleziona o carica un disegno per vedere l'anteprima.</div>
        )}
      </div>
    </div>
  );
}

