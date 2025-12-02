import React from "react";
import { useParametriStore } from "../store/parametriStore";
import DEFECT_RULES from "../data/defectRules";
import AIAssistant from "../components/AIAssistant";
import { useCadStore } from "@/store/cadStore";
import { ThreeViewer } from "@/components/ThreeViewer";

export default function Difetti() {
  // Read CAD unified store
  const { status, viewerUrl, volumeCm3, thicknessAvgMm, error } = useCadStore((s) => ({ status: s.status, viewerUrl: s.viewerUrl, volumeCm3: s.volumeCm3, thicknessAvgMm: s.thicknessAvgMm, error: s.error }));

  const { calculated, applyDefectFix, setDefect } = useParametriStore((s: any) => ({ calculated: s.calculated, applyDefectFix: s.applyDefectFix, setDefect: s.setDefect }));

  const difettiList = DEFECT_RULES;

  if (status !== "ready" || !viewerUrl) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Difetti</h1>
        <p className="text-gray-600">Carica un disegno nella pagina Parametri.</p>
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
                    // apply defect via parametri store
                    try { setDefect(d.id); } catch (_) {}
                    try { applyDefectFix(); } catch (_) {}
                    alert(`Applicata correzione per '${d.label}'. Controlla Parametri.`);
                  }}
                >
                  {d.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <AIAssistant file={null} />
          </div>
        </div>
      </div>
      {calculated && (
        <div className="mt-4 text-sm text-gray-800">
          <p>Pressione iniezione: {(calculated as any).injectionPressure_bar ?? '-'} bar</p>
          <p>Velocità iniezione: {(calculated as any).injectionSpeed_cm3s ?? '-'} cm³/s</p>
          <p>VP: {(calculated as any).vp_cm3 ?? '-'} cm³</p>
          <p>Tempo raffreddamento: {(calculated as any).cooling_s ?? '-'} s</p>
        </div>
      )}
    </div>
  );
}
