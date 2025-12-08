import React from "react";
import clsx from "clsx";
import { useDefectsStore } from "@/stores/defectsStore";
import { useDrawingStore } from "@/stores/drawingStore";
import { useParametriStore } from "@/stores/parametriStore";
import ThreeViewer from "@/components/ThreeViewer";

const DEFECTS = [
  { id: 'SHORT_SHOT', label: 'Short shot', desc: 'Riempimento incompleto' },
  { id: 'BAVE', label: 'Bave', desc: 'Sbavature ai bordi' },
  { id: 'RITIRO', label: 'Ritiro', desc: 'Depressioni e cave' },
  { id: 'DEFORMAZIONE', label: 'Deformazione', desc: 'Pezzo storto' },
];

export default function Difetti() {
  const selectedDefectId = useDefectsStore((s) => s.selectedDefectId);
  const setSelectedDefect = useDefectsStore((s) => s.setSelectedDefect);

  const glbUrl = useDrawingStore((s) => s.glbUrl);

  const result = useParametriStore((s) => s.result);
  const loading = useParametriStore((s) => s.loading);

  const hasModel = !!useDrawingStore((s) => s.glbUrl || s.previewUrl);
  const modelUrl = useDrawingStore((s) => s.glbUrl || s.previewUrl || null);

  const selectedDefect = DEFECTS.find((d) => d.id === selectedDefectId) ?? null;

  return (
    <div className="flex h-full min-h-[480px]">
      {/* SIDEBAR SINISTRA */}
      <aside className="w-64 bg-slate-900 text-slate-100 border-r border-slate-700 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-700">
          <h2 className="text-lg font-bold">Difetti</h2>
          <p className="text-xs text-slate-400">Seleziona un difetto per applicare correzioni</p>
        </div>

        <div className="flex-1 overflow-auto">
          {DEFECTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDefect(d.id)}
              className={clsx(
                "w-full text-left px-3 py-2 border-b border-slate-700 cursor-pointer text-sm",
                d.id === selectedDefectId
                  ? "bg-yellow-400 text-slate-900 font-semibold"
                  : "hover:bg-slate-800"
              )}
            >
              <div className="flex flex-col">
                <span>{d.label}</span>
                <span className="text-xs text-slate-300">{d.desc}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
          <div>Stato calcolo: {loading ? 'Calcolo in corso…' : 'Idle'}</div>
        </div>
      </aside>

      {/* AREA DESTRA */}
      <main className="flex-1 flex flex-col bg-slate-800">
        {/* viewer 3D in alto */}
        <div className="flex-1 border-b border-slate-700 relative">
          {hasModel ? (
            <ThreeViewer
              glbUrl={glbUrl}
              viewerUrl={modelUrl}
              selectedPinId={selectedDefectId ?? null}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 text-sm">
              Carica un disegno e completa il wizard per vedere il modello 3D.
            </div>
          )}
        </div>

        {/* pannello info difetto + stato correzione */}
        <section className="p-4 text-slate-100 space-y-3">
          {selectedDefectId ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-slate-900 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
              <span>Correzione applicata automaticamente</span>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              Seleziona un difetto nella lista a sinistra per applicare correzioni automatiche.
            </div>
          )}

          {selectedDefect && (
            <div className="mt-2">
              <h2 className="text-lg font-bold text-yellow-300">Dettaglio difetto</h2>
              <p className="text-sm text-slate-200 mt-1">{selectedDefect.desc}</p>

              {result ? (
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-100">
                  <div>Velocità iniezione</div>
                  <div className="text-right">{(result as any).velocitaIniezione ?? '—'} cm³/s</div>
                  <div>Pressione iniezione</div>
                  <div className="text-right">{(result as any).pressioneIniezione ?? '—'} bar</div>
                  <div>Pressione pack</div>
                  <div className="text-right">{(result as any).packPressione ?? '—'} bar</div>
                  <div>Tempo raffreddamento</div>
                  <div className="text-right">{(result as any).raffreddamentoTempo ?? '—'} s</div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs mt-2">
                  Parametri non disponibili: completa prima il wizard (geometria, pressa, materiale).
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
