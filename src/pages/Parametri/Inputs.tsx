import { useParametriStore } from "../../store/parametriStore";
import arburgPressCatalog from "../../data/arburgPressCatalog";
import materialCatalog from "../../data/materialCatalog";

export default function Inputs() {
  const {
    pressaId,
    screwDiameter_mm,
    materialeId,
    setPressaId,
    setScrewDiameter,
    setMaterialeId,
    calculate,
  } = useParametriStore();

  const selectedMachine = arburgPressCatalog.find((m: any) => m.id === pressaId);

  const availableScrews: number[] =
    selectedMachine?.injectionUnits
      ?.map((u: any) => u.screwDiameter_mm)
      .filter((v: any, i: number, arr: any[]) => arr.indexOf(v) === i) || [];

  return (
    <div className="bg-[#0b1f30] p-4 rounded-lg border border-yellow-500 space-y-4">
      <h2 className="text-xl text-white font-semibold">
        Selezioni Operatore
      </h2>

      {/* PRESSA ARBURG */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Pressa Arburg</label>
        <select
          className="w-full bg-[#0d263b] text-white p-2 rounded"
          value={pressaId || ""}
          onChange={(e) => setPressaId(e.target.value || null)}
        >
          <option value="">Seleziona pressa</option>
          {arburgPressCatalog.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.nome ?? m.id}
            </option>
          ))}
        </select>
      </div>

      {/* DIAMETRO VITE */}
      {pressaId && (
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Diametro vite (mm)</label>
          <select
            className="w-full bg-[#0d263b] text-white p-2 rounded"
            value={screwDiameter_mm ?? ""}
            onChange={(e) =>
              setScrewDiameter(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Seleziona diametro vite</option>
            {availableScrews.map((d) => (
              <option key={d} value={d}>
                {d} mm
              </option>
            ))}
          </select>
        </div>
      )}

      {/* MATERIALE */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Materiale</label>
        <select
          className="w-full bg-[#0d263b] text-white p-2 rounded"
          value={materialeId || ""}
          onChange={(e) => setMaterialeId(e.target.value || null)}
        >
          <option value="">Seleziona materiale</option>
          {materialCatalog.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.nomeCommerciale ?? m.family ?? m.id}
            </option>
          ))}
        </select>
      </div>

      {/* CALCOLA */}
      <button
        onClick={calculate}
        className="bg-yellow-500 text-black w-full py-2 font-semibold rounded mt-2"
      >
        Calcola Parametri
      </button>
    </div>
  );
}
