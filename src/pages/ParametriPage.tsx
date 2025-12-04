import React, { useEffect } from "react";
import { useCadStore } from "@/store/cadStore";
import { useParametriStore } from "@/store/parametriStore";
import { usePressStore } from "@/store/pressStore";

import { useDefectsStore } from "@/store/defectsStore"; // se esiste, altrimenti puoi rimuoverlo
import Inputs from "@/pages/Parametri/Inputs";
import CalculatedParameters from "@/pages/Parametri/CalculatedParameters";
import GeometryInfo from "@/pages/Parametri/GeometryInfo";

const ParametriPage: React.FC = () => {
  // CAD: analisi + viewer
  const cadAnalysis = useCadStore((s) => (s as any).result ?? (s as any).analysis ?? null);
  const cadStatus = useCadStore((s) => (s as any).status ?? (s as any).state ?? "idle");
  const cadError = useCadStore((s) => (s as any).error ?? null);
  const cadViewerUrl = useCadStore((s) => (s as any).viewerUrl ?? null);

  // Pressa selezionata (pressStore deve già esistere)
  const selectedPress = usePressStore((s) => (s as any).selectedPress ?? (s as any).currentPress ?? null);
  const selectedScrewDiameter = usePressStore((s) => (s as any).selectedScrewDiameter_mm ?? (s as any).screwDiameter_mm ?? null);

  // Parametri store
  const geometry = useParametriStore((s) => s.geometry);
  const setGeometry = useParametriStore((s) => s.setGeometry);
  const setViewerUrl = useParametriStore((s) => s.setViewerUrl);
  const setPress = useParametriStore((s) => s.setPress);
  const materialId = useParametriStore((s) => s.materialId);
  const setMaterial = useParametriStore((s) => s.setMaterial);
  // Keep calculate access but avoid placing it in effect deps
  const calculate = useParametriStore((s) => s.calculate);
  const calculated = useParametriStore((s) => s.calculated);
  const loading = useParametriStore((s) => s.loading);
  const error = useParametriStore((s) => s.error);

  // Primitive selectors to avoid object identity changes triggering effects
  const geometryVolume = useParametriStore((s) => (s.geometry as any)?.volumeCm3 ?? (s.geometry as any)?.volumePezzo_cm3 ?? null);
  const geometryReadyFlag = !!geometryVolume && geometryVolume > 0;
  const pressId = usePressStore((s) => (s as any).selectedPress?.id ?? (s as any).currentPress?.id ?? null);
  const screwDiameter = usePressStore((s) => (s as any).selectedScrewDiameter_mm ?? (s as any).screwDiameter_mm ?? null);

  // Se Inputs già gestisce la scelta materiale → Inputs deve chiamare setMaterial().
  // Se la scelta materiale è in un altro store, qui devi fare il bridge.

  // 1) Bridge CAD → parametriStore (geometria + viewerUrl)
  useEffect(() => {
    if (!cadAnalysis) return;

    console.log("[ParametriPage] CAD analysis ricevuta:", cadAnalysis);

    const volumeCm3 = (cadAnalysis as any).volumeCm3 ?? (cadAnalysis as any).volume ?? null;

    const thicknessAvgMm =
      (cadAnalysis as any).thicknessAvgMm ?? (cadAnalysis as any).avgThickness ?? null;

    const bbox = (cadAnalysis as any).bbox ?? (cadAnalysis as any).boundingBox ?? null;

    setGeometry({
      volumeCm3,
      thicknessAvgMm,
      bbox,
    });

    if (cadViewerUrl) {
      setViewerUrl(cadViewerUrl);
    }
  }, [cadAnalysis, cadViewerUrl]);

  // 2) Bridge Pressa → parametriStore
  useEffect(() => {
    if (!selectedPress || !(selectedPress as any).id) return;

    setPress({
      pressaId: (selectedPress as any).id,
      screwDiameter_mm: selectedScrewDiameter ?? null,
    });

    console.log("[ParametriPage] Pressa selezionata:", {
      id: (selectedPress as any).id,
      screwDiameter_mm: selectedScrewDiameter,
    });
  }, [selectedPress?.id, selectedScrewDiameter]);

  // 3) QUI DEVI ASSICURARTI CHE materialId VENGA POPOLATO
  //    SE Inputs.tsx già chiama useParametriStore().setMaterial(id), non serve fare altro.
  //    Se invece materiale viene salvato in un altro store, devi fare il bridge come fatto per la pressa.

  // 4) Auto-calcolo quando ho: geometria + pressa + materiale
  // Use only primitives in deps to avoid infinite re-render loops caused by
  // object identity changes (geometry, selectedPress, etc.). Also avoid
  // placing the `calculate` function itself in deps — Zustand guarantees its
  // stability.
  useEffect(() => {
    const ready =
      geometryReadyFlag &&
      !!pressId &&
      !!screwDiameter &&
      !!materialId;

    if (!ready) return;

    if (calculated !== null) return; // evita ricalcoli infiniti

    console.log("[ParametriPage] AUTO-CALC RUN");
    try {
      calculate();
    } catch (e) {
      console.warn('[ParametriPage] calculate() failed', e);
    }
  }, [geometryReadyFlag, pressId, screwDiameter, materialId]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Stato CAD */}
      {cadStatus === "loading" && (
        <div className="text-sm text-blue-500">Analisi disegno in corso...</div>
      )}
      {cadError && (
        <div className="text-sm text-red-500">Errore analisi disegno: {cadError}</div>
      )}

      {/* Info geometria */}
      <GeometryInfo />

      {/* Sezione input (pressa, vite, materiale, ecc.) */}
      <Inputs />

      {/* Stato calcolo */}
      {loading && (
        <div className="text-sm text-blue-500">Calcolo parametri in corso...</div>
      )}
      {error && (
        <div className="text-sm text-red-500">Errore calcolo parametri: {error}</div>
      )}

      {/* Risultati parametri */}
      <CalculatedParameters />

      {/* Debug opzionale (puoi togliere dopo i test) */}
      <pre className="mt-4 text-xs text-gray-500 bg-black/5 p-2 rounded">
        DEBUG:
        {"\n"}
        geometry: {JSON.stringify(geometry, null, 2)}
        {"\n"}
        press: {JSON.stringify(selectedPress, null, 2)}
        {"\n"}
        materialId: {JSON.stringify(materialId, null, 2)}
        {"\n"}
        calculated: {JSON.stringify(calculated, null, 2)}
      </pre>
    </div>
  );
};

export default ParametriPage;

