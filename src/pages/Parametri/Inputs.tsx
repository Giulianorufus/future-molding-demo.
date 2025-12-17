import React, { useEffect, useState } from "react";
import { useParametriStore } from "../../store/parametriStore";
import { ARBURG_PRESS_CATALOG } from "../../data/arburgPressCatalog";
import { materialCatalog } from "../../data/materialCatalog";

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

  const selectedMachine = ARBURG_PRESS_CATALOG.find((m: any) => m.id === pressaId);

  const availableScrews: number[] =
    (selectedMachine?.injectionUnits || [])
      .flatMap((iu: any) => (iu.screwVariants || []).map((s: any) => s.screwDiameter_mm))
      .filter((v: any, i: number, arr: any[]) => arr.indexOf(v) === i) || [];

  const [screwWarning, setScrewWarning] = useState<string | null>(null);

  useEffect(() => {
    // when pressa changes, if current screw is not available, fallback to nearest
    if (!pressaId) {
      setScrewWarning(null);
      return;
    }

    if (!availableScrews || availableScrews.length === 0) {
      setScrewWarning("Nessuna vite disponibile per questa pressa");
      setScrewDiameter(null);
      return;
    }

    if (screwDiameter_mm == null) {
      // nothing selected yet
      setScrewWarning(null);
      return;
    }

    if (!availableScrews.includes(screwDiameter_mm)) {
      // find nearest; if tie prefer the larger diameter
      const sorted = availableScrews.slice().sort((a, b) => {
        const da = Math.abs(a - screwDiameter_mm);
        const db = Math.abs(b - screwDiameter_mm);
        if (da === db) return b - a; // prefer larger
        return da - db;
      });
      const nearest = sorted[0];
      setScrewDiameter(nearest);
      setScrewWarning(`Vite ${screwDiameter_mm} mm non disponibile su questa pressa — selezionata ${nearest} mm`);
      const t = setTimeout(() => setScrewWarning(null), 6000);
      return () => clearTimeout(t);
    } else {
      setScrewWarning(null);
    }
  }, [pressaId, screwDiameter_mm, availableScrews, setScrewDiameter]);

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
          {ARBURG_PRESS_CATALOG.map((m: any) => (
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
          {screwWarning && (
            <p className="text-sm text-yellow-300 mt-1">{screwWarning}</p>
          )}
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
