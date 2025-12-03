import { useState } from "react";
import { useDrawingUpload } from "@/hooks/useDrawingUpload";
import { useToast } from "@/components/ui/use-toast";

export default function Disegni() {
  const [file, setFile] = useState<File | null>(null);
  const { handleUpload, isUploading } = useDrawingUpload();
  const { toast } = useToast();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const id = await handleUpload(f);
      if (id) {
        toast({ title: "Caricamento completato", description: "Il disegno è ora disponibile in Parametri e Difetti." });
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Disegni</h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-xl mb-10">
        <label className="font-semibold text-gray-800 block mb-2">
          Carica disegno tecnico
        </label>
        <input
          type="file"
          onChange={onFileChange}
          disabled={isUploading}
          className="bg-gray-100 border border-gray-300 rounded px-4 py-2 w-full"
        />

        {isUploading && <p className="mt-2 text-sm text-blue-600">Caricamento e analisi in corso...</p>}

        {file && !isUploading && (
          <p className="mt-3 text-blue-700 font-semibold">
            File selezionato: {file.name}
          </p>
        )}
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Disegni salvati</h2>
        <p className="text-gray-600">Nessun disegno presente.</p>
      </div>
    </div>
  );
}
