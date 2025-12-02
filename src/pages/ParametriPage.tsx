import React from "react";
import { useAppStore } from "@/store/appStore";
import { getMaterials, type IMaterial } from "@/fm-core";
import PressSelection from "@/components/Parametri/PressSelection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDrawing, loadDrawings, type DrawingMeta } from "@/services/storage";
import { saveDrawingFile, getDrawingBlob } from "@/services/db";
import { analyzeBlob } from "@/utils/simpleAnalysis";
import DrawingPreview from "@/components/Parametri/DrawingPreview";
import { useModelStore } from '@/store/modelStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { startCadPipeline } from '@/cad/cadPipeline';
import { useCadStore } from '@/store/cadStore';
import type { CadAnalysisResult } from '@/cad/types';
import { useDrawingStore } from '@/store/drawingStore';
import { getDrawingURL } from '@/services/db';
import { useParametriStore } from '@/store/parametriStore';

import { calculateInjection } from "@/services/calculationEngine";
import { exportToJSON } from '@/utils/export';

// --- helper: call server analyze endpoint (module scope to keep hooks stable) ---
async function analyzeServerFile(file: Blob | File, filename?: string) {
  const fd = new FormData();
  const name = filename ?? ((file as File).name ?? 'upload.bin');
  // if it's a Blob without name, wrap into File for FormData compatibility
  const payload = file instanceof File ? file : new File([file], name);
  fd.append('file', payload, name);

  const resp = await fetch('/api/calc/analyze', { method: 'POST', body: fd });
  if (!resp.ok) {
    throw new Error(`Server analyze failed: ${resp.status} ${resp.statusText}`);
  }
  const body = await resp.json();
  // normalizza campi
  return {
    volume_cm3: body.volume ?? body.volume_cm3,
    thickness_mm: body.thickness_min ?? body.thickness_mm,
    surface_area: body.surface_area ?? body.area,
    projectedArea_cm2: body.projectedArea_cm2 ?? body.area_cm2,
    warnings: body.warnings || []
  } as any;
}

// --- helper: call server convert endpoint for STEP/IGES (returns objectURL) ---
async function convertServerFile(file: Blob | File, filename?: string) {
  const fd = new FormData();
  const name = filename ?? ((file as File).name ?? 'upload.step');
  const payload = file instanceof File ? file : new File([file], name);
  fd.append('file', payload, name);

  const resp = await fetch('/api/calc/convert', { method: 'POST', body: fd });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Convert failed: ${resp.status} ${resp.statusText} ${txt}`);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('model/gltf-binary') || contentType.includes('application/octet-stream')) {
    const ab = await resp.arrayBuffer();
    const blob = new Blob([ab], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    return url;
  }

  // If server returned JSON (gltf), create a blob
  if (contentType.includes('application/json') || contentType.includes('application/ld+json')) {
    const body = await resp.json();
    if (body && body.gltf) {
      const blob = new Blob([JSON.stringify(body.gltf)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      return url;
    }
    // otherwise return JSON as text URL
    const txt = JSON.stringify(body);
    const blob = new Blob([txt], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  // fallback: try to read as arrayBuffer and create object URL
  const ab2 = await resp.arrayBuffer();
  const blob2 = new Blob([ab2]);
  return URL.createObjectURL(blob2);
}

// Funzione centrale: aggiorna store in modo atomico
function handleAnalysisDone(result: any) {
  const { setAnalysis, setViewerUrl } = useModelStore.getState();

  if (!result) {
    console.warn("handleAnalysisDone: risultato analisi nullo");
    setAnalysis(null);
    setViewerUrl(null);
    return;
  }

  if (!result.viewerUrl) {
    console.warn("handleAnalysisDone: viewerUrl mancante, viewer disattivato");
  }

  try {
    setAnalysis(result as any);
  } catch (e) {
    console.warn('handleAnalysisDone: setAnalysis failed', e);
  }
  try {
    // Preserve existing viewerUrl unless the analysis result explicitly provides one
    const current = useModelStore.getState().viewerUrl ?? null;
    setViewerUrl(result.viewerUrl ?? current ?? null);
  } catch (e) {
    console.warn('handleAnalysisDone: setViewerUrl failed', e);
  }
}

export default function ParametriPage() {
  const {
    selectedMaterial,
    setMarca,
    setModello,
    setSelectedMaterial,
    calculationResult,
    setCalculationResult,
  } = useAppStore();
  const { toast } = useToast();
  const paramStore = useParametriStore();
  const [drawings, setDrawings] = useState<DrawingMeta[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [press, setPress] = useState<{ pressId?: string; modelId?: string; screwDiameter_mm?: number; useModelScrew?: boolean }>({ useModelScrew: true });
  const [analysis, setAnalysis] = useState<{ volume_cm3?: number; thickness_mm?: number } | null>(null);
  const [manual, setManual] = useState<{ thickness?: number; volume?: number; cushion?: number }>({});
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [showManualInputs, setShowManualInputs] = useState(false);

  useEffect(() => {
    setDrawings(loadDrawings());
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedDrawingId) { setAnalysis(null); return; }
      const blob = await getDrawingBlob(selectedDrawingId);
      if (!blob) { setAnalysis(null); return; }
      // aggiorna modelStore così la pagina Difetti vede che c'è un disegno caricato
      try {
        const urlRec = await getDrawingURL(selectedDrawingId);
        if (urlRec) {
          // set viewer URL in unified model store (legacy model3D shape removed)
          useModelStore.getState().setViewerUrl(urlRec.url);
        }
      } catch (_) {}
      try {
      // prefer server-side analysis first
        try {
          const metaName = drawings.find((d) => d.id === selectedDrawingId)?.name;
          const serverResult = await analyzeServerFile(blob.blob, metaName ?? undefined);
          if (serverResult) {
            handleAnalysisDone(serverResult);
            return;
          }
          console.warn("Analisi server non valida, attivo fallback client");
        } catch (err) {
          console.error("Errore analisi server, attivo fallback client", err);
        }

        const res = await analyzeBlob(blob.blob);
        if (res) {
          const vol = res.volume_cm3 ?? null;
          const th = res.thickness_mm?.mean ?? null;
          const analysisObj = { volume_cm3: vol ?? undefined, thickness_mm: th ?? undefined };
          setAnalysis(analysisObj);
          applyAnalysisToModelStore({ volume: vol ?? undefined, thickness: th ?? undefined });
          // mirror into parametriStore geometry for calculation
          try {
            const geom = {
              volumePezzo_cm3: vol ?? null,
              volumeMaterozza_cm3: 0,
              volumeTotale_cm3: vol ?? null,
              areaProiettata_cm2: null,
              spessoreMedio_mm: th ?? null,
            };
            paramStore.setGeometry(geom as any);
          } catch (_) {}
        } else {
          setAnalysis(null);
          applyAnalysisToModelStore({ volume: undefined, thickness: undefined });
        }
      } catch {
        setAnalysis(null);
      }
    })();
  }, [selectedDrawingId, drawings]);

  // DEBUG: log analysis/press/material changes
  useEffect(() => {
    console.log("DEBUG FM:", { analysis, press, selectedMaterial });
  }, [analysis, press, selectedMaterial]);

  const materials = useMemo(() => getMaterials(), []);
  const { setAnalysis: setModelAnalysis, setViewerUrl: setModelViewerUrl } = useModelStore();

  function applyAnalysisToModelStore(opts: { volume?: number | null; thickness?: number | null; bbox?: { x: number; y: number; z: number } | null; format?: string; viewerUrl?: string | null }) {
    const currentViewer = useModelStore.getState().viewerUrl ?? null;
    const viewer = opts.viewerUrl ?? currentViewer ?? null;
    const res = {
      format: (opts.format as any) ?? (viewer ? 'glb' : 'stl'),
      volumeCm3: opts.volume ?? null,
      areaApproxCm2: null,
      thicknessAvgMm: opts.thickness ?? null,
      bbox: opts.bbox ?? { x: 0, y: 0, z: 0 },
      viewerUrl: viewer ?? '',
    } as CadAnalysisResult;
    try { setModelAnalysis(res); } catch (_) {}
    try { setModelViewerUrl(viewer); } catch (_) {}
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = addDrawing({ name: file.name, size: file.size, type: file.type });
      await saveDrawingFile(meta.id, file);
      setDrawings((prev) => [meta, ...prev]);
      setSelectedDrawingId(meta.id);
      toast({ title: "Disegno caricato", description: `${file.name} pronto per il calcolo` });
      // Important: register file in the unified model store so downstream pages (Difetti, viewers)
      // see that a file is loaded. This MUST be set, otherwise analysis/preview won't run.
      try { useModelStore.getState().setFile(file); } catch (_) {}
      // set model store so Difetti page can show the uploaded drawing (or placeholder)
      try {
        const urlRec = await getDrawingURL(meta.id);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const safeName = sanitizeFileName(meta.name || file.name || 'upload');
        if (urlRec) {
          useModelStore.getState().setViewerUrl(urlRec.url);
        } else {
          const tmp = URL.createObjectURL(file);
          useModelStore.getState().setViewerUrl(tmp);
        }
      } catch (_) {
        try { const tmp = URL.createObjectURL(file); useModelStore.getState().setViewerUrl(tmp); } catch(_){ }
      }
      // also set drawingStore file so AI assistant and viewers can request decrypted blob
      try { void useDrawingStore.getState().setFile(file); } catch (_) {}
      // Start unified CAD pipeline (analyze + set viewer URL in cadStore)
      try {
        const pipelineResult = await startCadPipeline(file);
        if (pipelineResult?.success) {
          const cadState = useCadStore.getState();
          // Mirror essential values into the legacy model store so downstream code keeps working
          applyAnalysisToModelStore({ volume: cadState.volumeCm3 ?? undefined, thickness: cadState.thicknessAvgMm ?? undefined, viewerUrl: cadState.viewerUrl ?? undefined, format: file.name.split('.').pop() ?? undefined });
        } else {
          // Pipeline failed: keep existing viewer URL (objectURL) and let user enter manual inputs
          const cadState = useCadStore.getState();
          applyAnalysisToModelStore({ volume: cadState.volumeCm3 ?? undefined, thickness: cadState.thicknessAvgMm ?? undefined, viewerUrl: cadState.viewerUrl ?? undefined });
        }
      } catch (err) {
        console.error('Errore pipeline CAD:', err);
      }
    } catch (err) {
      toast({ title: "Errore caricamento", description: String(err ?? "Impossibile salvare il file"), variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  }

  function handleCalc() {
    if (!selectedDrawingId) {
      toast({ title: "Seleziona disegno", description: "Carica o scegli un disegno prima di calcolare", variant: "destructive" });
      return;
    }
    if (!press?.modelId || !selectedMaterial) {
      toast({ title: "Compila i campi", description: "Pressa/Modello e Materiale sono obbligatori", variant: "destructive" });
      return;
    }

    // Determina sorgente dati: analisi o input manuali (per PDF/STEP)
    const spessore = analysis?.thickness_mm ?? manual.thickness ?? 2;
    const volumeCavita = analysis?.volume_cm3 ?? manual.volume ?? 10;
    const cushion = manual.cushion ?? 1;

    if (!analysis && (!manual.thickness || !manual.volume)) {
      toast({ title: "Dati mancanti", description: "Inserisci spessore e volume per file non analizzabili", variant: "destructive" });
      return;
    }

    // mirror selections into param store
    try { paramStore.setPressaId(press?.pressId ?? null); } catch (_) {}
    try { paramStore.setScrewDiameter(press?.screwDiameter_mm ?? null); } catch (_) {}
    try { paramStore.setMaterialeId(selectedMaterial?.id ?? null); } catch (_) {}

    const res = paramStore.calculate();
    try { setCalculationResult(res as any); } catch (_) {}
    if (res && (res as any).success) {
      toast({ title: "Calcolo completato", description: `Peso: ${(res as any).weight} g • Ciclo: ${(res as any).cycleTime} s` });
    } else if (res) {
      toast({ title: "Errore di calcolo", description: ((res as any).errors ?? []).join("; "), variant: "destructive" });
    }
  }

  // Auto-calc: esegue il calcolo solo quando l'analisi è disponibile
  async function autoCalculate() {
    if (!analysis) return;
    if (!press?.modelId) return;
    if (!selectedMaterial) return;
    if (autoLoading) return;

    setAutoError(null);
    setAutoLoading(true);
    try {
      const spessore = (analysis?.thickness_mm) ?? manual.thickness ?? 2;
      const volumeCavita = (analysis?.volume_cm3) ?? manual.volume ?? 10;
      const cushion = manual.cushion ?? 1;

      // mirror selections into param store
      try { paramStore.setPressaId(press?.pressId ?? null); } catch (_) {}
      try { paramStore.setScrewDiameter(press?.screwDiameter_mm ?? null); } catch (_) {}
      try { paramStore.setMaterialeId(selectedMaterial?.id ?? null); } catch (_) {}

      const res = paramStore.calculate();
      try { setCalculationResult(res as any); } catch (_) {}
      if (res && (res as any).success) {
        toast({ title: "Calcolo completato", description: `Peso: ${(res as any).weight} g • Ciclo: ${(res as any).cycleTime} s` });
      } else if (res) {
        toast({ title: "Errore di calcolo", description: ((res as any).errors ?? []).join('; '), variant: "destructive" });
      }
    } catch (err: any) {
      setAutoError(String(err?.message ?? err));
    } finally {
      setAutoLoading(false);
    }
  }

  useEffect(() => {
    if (!analysis) return;
    const selectedMachineId = press?.modelId ?? null;
    const selectedMaterialId = selectedMaterial?.id ?? null;
    if (!selectedMachineId) return;
    if (!selectedMaterialId) return;
    if (autoLoading) return;

    void autoCalculate();
  }, [analysis, press?.modelId, selectedMaterial?.id, autoLoading]);

  

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parametri di Stampaggio</h1>

      <div className="grid gap-6">
        {/* Carica/Seleziona disegno */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium">Disegno</label>
            <div className="flex gap-2">
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedDrawingId}
                onChange={(e) => setSelectedDrawingId(e.target.value)}
              >
                <option value="">Seleziona un disegno</option>
                {drawings.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <input ref={fileInputRef} type="file" accept=".stl,.glb,.gltf,.obj,.pdf,.dwg,.step,.stp" className="hidden" onChange={handleUpload} />
              <Button onClick={() => fileInputRef.current?.click()}>Carica disegno</Button>
            </div>
          </div>
        </div>

        {/* Pressa / Modello / Vite */}
        <div>
          <PressSelection
            value={press}
            onChange={(v) => {
              setPress(v);
              // Mantieni anche lo store sincronizzato per compatibilità
              setMarca((v.pressId as any) ?? "");
              setModello(v.modelId ?? "");
            }}
            disabled={!selectedDrawingId}
          />
          {!selectedDrawingId && (
            <div className="text-xs text-muted-foreground mt-2">Carica un disegno prima di selezionare la pressa.</div>
          )}
        </div>

        {/* Materiale */}
        <div className="space-y-2 md:max-w-sm">
          <label className="block text-sm font-medium">Materiale</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedMaterial?.id ?? ""}
            onChange={(e) => {
              const mat = materials.find((x) => x.id === e.target.value) ?? null;
              setSelectedMaterial(mat as IMaterial | null);
            }}
            disabled={!selectedDrawingId}
          >
            <option value="">{selectedDrawingId ? 'Seleziona materiale' : 'Carica disegno per abilitare'}</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {!selectedDrawingId && <div className="text-xs text-muted-foreground mt-2">Seleziona o carica un disegno per abilitare la scelta del materiale.</div>}
        </div>

        {/* Riepilogo analisi o input manuali se non disponibile */}
        {autoLoading ? (
          <div className="text-sm text-slate-700">Analisi in corso... attendere prego.</div>
        ) : autoError ? (
          <div className="text-sm text-red-600">Errore analisi: {autoError}</div>
        ) : analysis ? (
          <div className="text-sm text-slate-700">
            Analisi disegno: volume ≈ {analysis.volume_cm3?.toFixed(2)} cm³ • spessore medio ≈ {analysis.thickness_mm?.toFixed(2)} mm
          </div>
        ) : (
          <div className="text-sm text-slate-500">Nessuna analisi disponibile. Il sistema tenterà l'analisi automatica quando possibile.</div>
        )}

        <div className="mt-2">
          <button className="text-sm text-blue-600 underline" onClick={() => setShowManualInputs((s) => !s)}>
            {showManualInputs ? 'Nascondi input manuali' : 'Mostra input manuali (advanced)'}
          </button>
        </div>

        {showManualInputs && !autoLoading && (
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Spessore medio (mm)</label>
              <input type="number" className="w-full border rounded px-3 py-2" min={0} step={0.1}
                value={manual.thickness ?? ""}
                onChange={(e) => setManual((m) => ({ ...m, thickness: e.target.value === "" ? undefined : Number(e.target.value) }))}
                placeholder="Es. 2.0" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Volume cavità (cm³)</label>
              <input type="number" className="w-full border rounded px-3 py-2" min={0} step={0.1}
                value={manual.volume ?? ""}
                onChange={(e) => setManual((m) => ({ ...m, volume: e.target.value === "" ? undefined : Number(e.target.value) }))}
                placeholder="Es. 10.0" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Cushion (cm³)</label>
              <input type="number" className="w-full border rounded px-3 py-2" min={0} step={0.1}
                value={manual.cushion ?? ""}
                onChange={(e) => setManual((m) => ({ ...m, cushion: e.target.value === "" ? undefined : Number(e.target.value) }))}
                placeholder="Es. 1.0" />
            </div>
            <div className="text-xs text-slate-500 md:col-span-3">Formati non analizzabili automaticamente (PDF/STEP/DWG): inserisci questi valori per procedere.</div>
          </div>
        )}

        {/* Preview del disegno selezionato */}
        {selectedDrawingId && (
          <DrawingPreview drawingId={selectedDrawingId} />
        )}
      </div>

      <div className="mt-6">
        <Button
          onClick={handleCalc}
          disabled={!selectedDrawingId || !press?.modelId || !selectedMaterial || autoLoading}
          title={!selectedDrawingId ? 'Carica o seleziona un disegno per abilitare il calcolo' : (!press?.modelId ? 'Seleziona modello pressa' : (!selectedMaterial ? 'Seleziona materiale' : (autoLoading ? 'Analisi in corso' : 'Pronto')))}
        >
          {autoLoading ? 'Analisi in corso...' : 'Calcola'}
        </Button>

        {/* helper reasons when disabled */}
        {(!selectedDrawingId || !press?.modelId || !selectedMaterial) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {!selectedDrawingId && <div>• Carica o seleziona un disegno (obbligatorio).</div>}
            {!press?.modelId && <div>• Seleziona la pressa e il modello (obbligatorio).</div>}
            {!selectedMaterial && <div>• Seleziona il materiale (obbligatorio).</div>}
          </div>
        )}
      </div>

      {calculationResult && calculationResult.success && (
        <div className="mt-4 border rounded p-4 bg-white">
          <div className="font-semibold mb-2">Risultati</div>

          {/* Shot */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Shot</div>
            <div className="font-medium">Peso: {calculationResult.weight} g</div>
          </div>

          {/* Iniezione */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Iniezione</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Tempo ciclo:</div><div>{calculationResult.cycleTime} s</div>
              <div>Velocità iniezione:</div><div>{calculationResult.injectionSpeed_cm3s ?? '-'} cm³/s</div>
              <div>Pressione iniezione:</div><div>{calculationResult.injectionPressure_bar ?? '-'} bar</div>
              <div>RPM vite:</div><div>{calculationResult.rpm ?? '-'} rpm</div>
            </div>
          </div>

          {/* VP */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">VP (Volume)</div>
            <div className="font-medium">{calculationResult.vp_cm3 ?? '-'} cm³</div>
          </div>

          {/* Pack */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Pack</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Pressione Pack:</div><div>{calculationResult.pack_bar ?? '-'} bar</div>
              <div>Tempo Pack:</div><div>{calculationResult.pack_s ?? '-'} s</div>
            </div>
          </div>

          {/* Raffreddamento */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Raffreddamento</div>
            <div className="font-medium">{calculationResult.cooling_s ?? '-'} s</div>
          </div>

          {/* Plastificazione */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Plastificazione</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Contropressione:</div><div>{calculationResult.backpressure_bar ?? '-'} bar</div>
            </div>
          </div>

          {/* Tonnellaggio */}
          <div className="mb-3">
            <div className="text-xs text-gray-500">Tonnellaggio</div>
            <div className="font-medium">{calculationResult.requiredTonnage_t ?? '-'} t • Pressa adeguata: {calculationResult.pressAdequate ? 'Sì' : 'No'}</div>
          </div>

          {/* Note */}
          {(calculationResult as any)?.notes && (
            <div className="mt-2 text-sm text-slate-700">
              <div className="text-xs text-gray-500">Note</div>
              <div>{(calculationResult as any).notes}</div>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded"
              onClick={async () => {
                const machineParams = {
                  injectionSpeed_cm3s: Number((calculationResult.injectionSpeed_cm3s ?? 0).toFixed(2)),
                  injectionPressure_bar: Number((calculationResult.injectionPressure_bar ?? 0).toFixed(2)),
                  vp_cm3: Number((calculationResult.vp_cm3 ?? 0).toFixed(2)),
                  pack_bar: Number((calculationResult.pack_bar ?? 0).toFixed(2)),
                  pack_s: Number((calculationResult.pack_s ?? 0).toFixed(2)),
                  cooling_s: Number((calculationResult.cooling_s ?? 0).toFixed(2)),
                  rpm: Number((calculationResult.rpm ?? 0).toFixed(0)),
                  backpressure_bar: Number((calculationResult.backpressure_bar ?? 0).toFixed(2)),
                  requiredTonnage_t: Number((calculationResult.requiredTonnage_t ?? 0).toFixed(2)),
                };
                try {
                  await navigator.clipboard.writeText(JSON.stringify(machineParams));
                  toast({ title: 'Parametri copiati', description: 'Parametri macchina copiati negli appunti (JSON).' });
                } catch (e) {
                  // ignore clipboard errors
                  console.warn('Clipboard failed', e);
                }
                exportToJSON(`params_${Date.now()}.json`, machineParams);
              }}
            >
              Esporta parametri macchina
            </button>
            <button className="px-3 py-2 bg-gray-100 text-gray-900 rounded" onClick={() => window.print()}>Stampa</button>
          </div>
        </div>
      )}

      {calculationResult && !calculationResult.success && (
        <div className="mt-4 border rounded p-4 bg-red-50 text-red-700">
          <div className="font-semibold mb-2">Errori</div>
          <ul className="list-disc ml-5 text-sm">
            {(calculationResult.errors ?? []).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
