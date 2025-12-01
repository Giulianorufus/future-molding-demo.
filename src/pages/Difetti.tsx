import React from "react";
import { useParametriStore } from "../store/parametriStore";
import DEFECT_RULES from "../data/defectRules";
import ModelViewer from "../components/ModelViewer";
import AIAssistant from "../components/AIAssistant";
import { useDrawingStore } from "../store/drawingStore";
import { useModelStore } from "../store/modelStore";

export default function Difetti() {
  const { model3D } = useModelStore();
  const apply = useParametriStore((s: any) => (s as any).applyCorrection ?? (() => {}));

  const difettiList = DEFECT_RULES;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Difetti</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white shadow">
          <ModelViewer />
        </div>

        <div className="border rounded p-4 bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">Seleziona un difetto</h2>

          {!model3D ? (
            <div className="text-gray-500">Carica prima un disegno nella sezione Parametri.</div>
          ) : (
            <ul className="space-y-2">
              {difettiList.map((d) => (
                <li key={d.id}>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
                    onClick={() => {
                      // call store with defect id so dynamic or static rules are applied centrally
                      apply({ __defectId: d.id } as any);
                      alert(`Applicata correzione per '${d.label}'. Controlla Parametri.`);
                    }}
                  >
                    {d.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* AI assistant mounted here so user can analyze drawing/photos */}
          <div className="mt-6">
            <AIAssistant file={useDrawingStore((s) => s.file)} />
          </div>
        </div>
      </div>
    </div>
  );
}
