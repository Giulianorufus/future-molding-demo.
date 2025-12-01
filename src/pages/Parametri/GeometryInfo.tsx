import React from "react";
import { useParametriStore } from "../../store/parametriStore";

export default function GeometryInfo() {
  const geo = useParametriStore((s) => s.geometry) as any;

  if (!geo) return null;

  // map property names (store uses suffixed names)
  const volumePezzo = geo.volumePezzo_cm3 ?? geo.volumePezzo ?? "--";
  const volumeMaterozza = geo.volumeMaterozza_cm3 ?? geo.volumeMaterozza ?? "--";
  const volumeTotale = (typeof volumePezzo === 'number' && typeof volumeMaterozza === 'number') ? Math.round((volumePezzo + volumeMaterozza) * 100) / 100 : "--";
  const areaProiettata = geo.areaProiettata_cm2 ?? geo.areaProiettata ?? "--";
  const spessoreMedio = geo.spessoreMedio_mm ?? geo.spessoreMedio ?? "--";

  return (
    <div className="bg-[#0b1f30] p-4 rounded-lg border border-yellow-500 space-y-2">
      <h2 className="text-xl font-semibold text-white">Geometria (CAD)</h2>

      <Row label="Volume pezzo" value={`${volumePezzo} cm³`} />
      <Row label="Volume materozza" value={`${volumeMaterozza} cm³`} />
      <Row label="Volume totale" value={`${volumeTotale} cm³`} />
      <Row label="Area proiettata" value={`${areaProiettata} cm²`} />
      <Row label="Spessore medio" value={`${spessoreMedio} mm`} />
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
