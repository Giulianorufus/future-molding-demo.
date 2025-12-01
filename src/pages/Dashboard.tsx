export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-gray-600 text-sm">Produzione oggi</h2>
          <p className="text-3xl font-bold mt-2">0 pezzi</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-gray-600 text-sm">Scarti oggi</h2>
          <p className="text-3xl font-bold mt-2 text-red-600">0</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-gray-600 text-sm">Ore macchina</h2>
          <p className="text-3xl font-bold mt-2">0 h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-3">
            Ultimi disegni caricati
          </h3>
          <p className="text-gray-600">Nessun disegno disponibile.</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-3">
            Ultimi parametri calcolati
          </h3>
          <p className="text-gray-600">Nessun calcolo disponibile.</p>
        </div>
      </div>
    </div>
  );
}

