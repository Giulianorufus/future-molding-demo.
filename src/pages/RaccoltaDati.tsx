export default function RaccoltaDati() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Raccolta Dati</h1>

      <div className="bg-white shadow rounded-xl p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">
          Parametri macchina registrati
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-800 text-white text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Pressa</th>
              <th className="p-3">Modello</th>
              <th className="p-3">Ciclo (s)</th>
              <th className="p-3">Pressione (bar)</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="p-3 text-gray-600">—</td>
              <td className="p-3 text-gray-600">—</td>
              <td className="p-3 text-gray-600">—</td>
              <td className="p-3 text-gray-600">—</td>
              <td className="p-3 text-gray-600">—</td>
              <td className="p-3 text-gray-600">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
