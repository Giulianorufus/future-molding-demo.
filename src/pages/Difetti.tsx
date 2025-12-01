import React from "react";
import { useParametriStore } from "../store/parametriStore";
import DEFECT_RULES from "../data/defectRules";
import AIAssistant from "../components/AIAssistant";
import { useDrawingStore } from "../store/drawingStore";
import { useModelStore } from "../store/modelStore";
import { ThreeViewer } from "@/components/ThreeViewer";

export default function Difetti() {
  const { analysis, viewerUrl } = useModelStore((s: any) => ({ analysis: s.analysis, viewerUrl: s.viewerUrl }));
  const apply = useParametriStore((s: any) => (s as any).applyCorrection ?? (() => {}));

  const difettiList = DEFECT_RULES;

  const ready = !!analysis && !!viewerUrl;

  if (!ready) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Difetti</h1>
        <p className="text-sm text-gray-600 mb-2">Nessun modello disponibile.</p>
        <p className="text-sm text-gray-600">Carica un disegno e calcola i parametri nella pagina <strong>Parametri</strong>, poi torna qui per la diagnosi difetti.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Difetti</h1>

      <div className="grid grid-cols-[2fr,1.2fr] gap-4">
        <div>
          <ThreeViewer viewerUrl={viewerUrl} />
        </div>

        <div className="border rounded p-4 bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">Seleziona un difetto</h2>
          <ul className="space-y-2">
            {difettiList.map((d) => (
              <li key={d.id}>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
                  onClick={() => {
                    apply({ __defectId: d.id } as any);
                    alert(`Applicata correzione per '${d.label}'. Controlla Parametri.`);
                  }}
                >
                  {d.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <AIAssistant file={useDrawingStore((s) => s.file)} />
          </div>
        </div>
      </div>
    </div>
  );
}
