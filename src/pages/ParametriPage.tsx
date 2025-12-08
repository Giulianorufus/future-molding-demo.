import { useParametriStore } from '../stores/parametriStore'

export default function ParametriPage() {
  const result = useParametriStore(s => s.result);
  const loading = useParametriStore(s => s.loading);
  const error = useParametriStore(s => s.error);

  if (loading) {
    return <div className="text-blue-600 font-semibold p-4">Calcolo in corso…</div>;
  }

  if (error) {
    return <div className="text-red-600 font-semibold p-4">Errore: {error}</div>;
  }

  if (!result) {
    return <div className="text-gray-600 p-4">Nessun calcolo disponibile. Completa il wizard.</div>;
  }

  return (
    <div className="p-4 space-y-6">

      {/* GEOMETRIA */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Geometria</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Volume pezzo</div><div className="text-right">{result.volumePezzo} cm³</div>
          <div>Volume materozza</div><div className="text-right">{result.volumeMaterozza} cm³</div>
          <div>Volume totale</div><div className="text-right">{result.volumeTotale} cm³</div>
          <div>Area proiettata</div><div className="text-right">{result.areaProiettata} cm²</div>
          <div>Spessore medio</div><div className="text-right">{result.spessoreMedio} mm</div>
        </div>
      </section>

      {/* INIEZIONE */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Iniezione</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Velocità iniezione</div><div className="text-right">{result.velocitaIniezione} cm³/s</div>
          <div>Pressione iniezione</div><div className="text-right">{result.pressioneIniezione} bar</div>
          <div>Fill time</div><div className="text-right">{result.fillTime} s</div>
        </div>
      </section>

      {/* COMMUTAZIONE VP */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Commutazione (VP)</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>VP volume</div><div className="text-right">{result.vpVolume} cm³</div>
          <div>VP pressione</div><div className="text-right">{result.vpPressione} bar</div>
        </div>
      </section>

      {/* PACK */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Post-pressione (Pack)</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Pressione pack</div><div className="text-right">{result.packPressione} bar</div>
          <div>Tempo pack</div><div className="text-right">{result.packTempo} s</div>
        </div>
      </section>

      {/* RAFFREDDAMENTO */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Raffreddamento</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Tempo raffreddamento</div><div className="text-right">{result.raffreddamentoTempo} s</div>
        </div>
      </section>

      {/* PLASTIFICAZIONE */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Plastificazione</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Velocità vite</div><div className="text-right">{result.viteVelocita} mm/s</div>
          <div>Contropressione</div><div className="text-right">{result.controPressione} bar</div>
          <div>Tempo dosatura</div><div className="text-right">{result.dosaturaTempo} s</div>
        </div>
      </section>

      {/* TONNELLAGGIO */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Tonnellaggio</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Richiesto</div><div className="text-right">{result.tonnellaggioRichiesto} kN</div>
          <div>Disponibile</div><div className="text-right">{result.tonnellaggioDisponibile} kN</div>
        </div>
      </section>

      {/* TEMPERATURE */}
      <section>
        <h2 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-1">Temperature</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>Z1</div><div className="text-right">{result.z1} °C</div>
          <div>Z2</div><div className="text-right">{result.z2} °C</div>
          <div>Z3</div><div className="text-right">{result.z3} °C</div>
          <div>Z4</div><div className="text-right">{result.z4} °C</div>
          <div>Stampo</div><div className="text-right">{result.stampo} °C</div>
          <div>Ugello</div><div className="text-right">{result.ugello} °C</div>
        </div>
      </section>

    </div>
  );
}

