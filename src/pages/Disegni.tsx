import { useState } from "react";
import { useDrawingLibraryStore } from "../stores/useDrawingLibraryStore";
import useDrawingStore from "../stores/drawingStore";
import { useDrawingUpload } from "@/hooks/useDrawingUpload";

export default function DisegniPage() {
  const drawings = useDrawingLibraryStore((s) => s.drawings);
  const addDrawing = useDrawingLibraryStore((s) => s.addDrawing);
  const removeDrawing = useDrawingLibraryStore((s) => s.removeDrawing);

  const [uploading, setUploading] = useState(false);
  const { handleUpload: uploadFile, isUploading } = useDrawingUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const id = await uploadFile(file);
      // read latest drawingStore state populated by the pipeline
      const ds = useDrawingStore.getState();
      addDrawing({
        fileName: file.name,
        glbUrl: ds.previewUrl ?? null,
        volumeCm3: ds.volumeCm3 ?? null,
      });
    } catch (err) {
      console.error("Errore caricamento:", err);
    }

    setUploading(false);
  };

  const handleOpen = (d: any) => {
    // Rimanda al wizard caricando i dati del disegno
    useDrawingStore.getState().setResult({
      glbUrl: d.glbUrl ?? null,
      volumeCm3: d.volumeCm3 ?? null,
      previewUrl: d.glbUrl ?? null,
    });

    window.location.hash = "#/wizard";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Disegni</h1>

      <div className="bg-white rounded shadow p-4 mb-8">
        <h2 className="font-semibold mb-2">Carica disegno tecnico</h2>

        <input type="file" className="border p-2" onChange={handleUpload} />
        {uploading && <p className="text-blue-600 mt-2">Caricamento...</p>}
      </div>

      <h2 className="font-semibold mb-3">Disegni salvati</h2>

      {drawings.length === 0 && (
        <p className="text-gray-500">Nessun disegno presente.</p>
      )}

      <div className="grid gap-3">
        {drawings.map((d) => (
          <div
            key={d.id}
            className="bg-white shadow p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{d.fileName}</p>
              <p className="text-xs text-gray-500">
                Volume: {d.volumeCm3 ?? "--"} cm³
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => handleOpen(d)}
              >
                Apri
              </button>

              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => removeDrawing(d.id)}
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
