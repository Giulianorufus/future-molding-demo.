import React, { useState } from "react";
import { useDrawingStore } from "../stores/drawingStore";
import { useParametriStore } from "../stores/parametriStore";
import { useDefectsStore } from "../stores/defectsStore";
import ThreeViewer from "../components/ThreeViewer";
import { DEFECT_PINS } from "../data/defectPins";

// Lista difetti mostrata nella sidebar
const DEFECTS = [
  { id: "short-shot", label: "Short Shot", desc: "Riempimento incompleto del pezzo." },
  { id: "burn-mark", label: "Burn Mark", desc: "Bruciature dovute ad aria intrappolata." },
  { id: "flash", label: "Bava / Sormonto", desc: "Materiale in eccesso oltre lo split-line." },
  { id: "sink-mark", label: "Affossamento", desc: "Ritiro locale dovuto a spessore alto." },
];

export default function DifettiPage() {
  // Stato UI (non scrive mai su store)
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);

  // Severity selection (store)
  const selectedSeverity = useDefectsStore((s) => s.selectedSeverity)
  const setSelectedSeverity = useDefectsStore((s) => s.setSelectedSeverity)
  const setSelectedDefectIdStore = useDefectsStore((s) => s.setSelectedDefectId)

  // Dati dal disegno (read-only)
  const glbUrl = useDrawingStore((s) => s.glbUrl);

  // Parametri calcolati (read-only)
  const result = useParametriStore((s) => s.result);
  const loading = useParametriStore((s) => s.loading);
  const error = useParametriStore((s) => s.error);

  // Normalizza gli id (defectPins usa underscore nella mappa)
  const normalizedId = selectedDefectId ? selectedDefectId.replace(/-/g, "_") : null;
  const selectedPin = normalizedId ? (DEFECT_PINS as any)[normalizedId] ?? null : null;

  return (
    <div className="flex h-full">
      {/* Sidebar Difetti */}
      <div className="w-64 border-r border-gray-300 p-4 bg-gray-100 flex-shrink-0">
        <h2 className="font-bold text-lg mb-3">Difetti</h2>

        <label className="block text-sm font-medium text-slate-200 mt-3">Severità correzione</label>

        <select
          aria-label="Severità correzione"
          className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value as any)}
        >
          <option value="low">Bassa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        {DEFECTS.map((def) => (
          <div
            key={def.id}
            className={`p-2 mb-2 rounded cursor-pointer ${
              selectedDefectId === def.id ? "bg-yellow-300 font-semibold" : "bg-white hover:bg-gray-200"
            }`}
            onClick={() => {
              setSelectedDefectId(def.id)
              try { setSelectedDefectIdStore(def.id) } catch (_) {}
            }}
          >
            {def.label}
          </div>
        ))}

        <div className="mt-6 text-sm text-gray-700">
          {selectedDefectId
            ? DEFECTS.find((d) => d.id === selectedDefectId)?.desc
            : "Seleziona un difetto per evidenziare la zona sul modello."}
        </div>
      </div>

      {/* Viewer 3D */}
      <div className="flex-1 p-4">
        {glbUrl ? (
          <ThreeViewer glbUrl={glbUrl} viewerUrl={glbUrl} selectedPin={selectedPin} />
        ) : (
          <div className="text-gray-500">Carica un disegno per visualizzare il modello.</div>
        )}
      </div>

      {/* Pannello Parametri (read-only) */}
      <div className="w-80 border-l border-gray-300 p-4 bg-gray-50 flex-shrink-0">
        <h2 className="font-bold text-lg mb-3">Parametri</h2>

        {/* visualizza ultima correzione applicata */}
        {useParametriStore((s) => s.lastDefectFix) && (
          <div className="mt-2 mb-3 rounded-md border border-slate-700 bg-slate-950 p-3">
            <div className="text-xs text-slate-300">
              Correzione: <span className="font-semibold">{useParametriStore((s) => s.lastDefectFix?.defectId)}</span> / {useParametriStore((s) => s.lastDefectFix?.severity)}
            </div>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-200">
              {useParametriStore((s) => s.lastDefectFix?.notes ?? []).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {loading && <div className="text-blue-600">Calcolo in corso…</div>}
        {error && <div className="text-red-600">{String(error)}</div>}

        {!loading && result && (
          <div className="text-sm space-y-2">
            <div>
              <strong>Iniezione:</strong>
              <br />
              Velocità: {result.velocityMmPerS ?? "--"} mm/s
              <br />
              Pressione: {result.pressureBar ?? "--"} bar
            </div>

            <div>
              <strong>Commutazione:</strong>
              <br />
              VP: {result.switchoverMs ?? "--"} ms
            </div>

            <div>
              <strong>Tempi:</strong>
              <br />
              Iniezione: {result.times?.injectionMs ?? "--"} ms
              <br />
              Raffreddamento: {result.times?.coolingMs ?? "--"} ms
            </div>

            <div>
              <strong>Tonnellaggio:</strong>
              <br />
              Richiesto: {result.tonnellaggioRequired ?? "--"} kN
            </div>
          </div>
        )}

        {!loading && !result && (
          <div className="text-gray-500 text-sm">I parametri verranno mostrati quando il wizard avrà completato il calcolo.</div>
        )}
      </div>
    </div>
  );
}
