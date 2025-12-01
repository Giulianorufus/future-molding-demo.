import { useState } from "react";

export default function Disegni() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Disegni</h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-xl mb-10">
        <label className="font-semibold text-gray-800 block mb-2">
          Carica disegno tecnico
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="bg-gray-100 border border-gray-300 rounded px-4 py-2 w-full"
        />

        {file && (
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
