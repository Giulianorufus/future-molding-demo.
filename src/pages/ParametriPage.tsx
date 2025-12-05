import React, { useEffect } from "react";
import { useDrawingStore } from "@/stores/drawingStore";
import { useParametriStore } from "@/stores/parametriStore";
import { usePressStore } from "@/stores/pressStore";
import { useMaterialStore } from "@/stores/materialStore";
import Inputs from "@/pages/Parametri/Inputs";
import CalculatedParameters from "@/pages/Parametri/CalculatedParameters";
import GeometryInfo from "@/pages/Parametri/GeometryInfo";

const ParametriPage: React.FC = () => {
  // CAD: analisi + viewer (now drawingStore)
  const volumeCm3 = useDrawingStore((s) => s.volumeCm3);
  const drawingIsLoading = useDrawingStore((s) => s.isLoading);
  const drawingError = useDrawingStore((s) => s.error);
  const drawingPreviewUrl = useDrawingStore((s) => s.previewUrl ?? s.glbUrl);

  // Pressa selezionata (pressStore)
  const selectedPressId = usePressStore((s) => s.selectedPressId);
  const pressSpec = usePressStore((s) => (s.catalog && selectedPressId ? s.catalog[selectedPressId] : null));
  const selectedScrewDiameter = pressSpec?.screwDiameters?.[0] ?? null;

  // Parametri store (orchestration handled inside parametriStore via subscriptions)
  const result = useParametriStore((s) => s.result);
  const isCalculating = useParametriStore((s) => s.isCalculating);
  const calcError = useParametriStore((s) => s.error);
  const materialId = useMaterialStore((s) => s.selectedMaterialId);
  const materialSpec = useMaterialStore((s) => (s.catalog && materialId ? s.catalog[materialId] : null));

  // Primitive selectors to avoid object identity changes triggering effects
  const geometryReadyFlag = !!volumeCm3 && volumeCm3 > 0;
  const pressId = selectedPressId;
  const screwDiameter = selectedScrewDiameter;

  // Se Inputs già gestisce la scelta materiale → Inputs deve chiamare setMaterial().
  // Se la scelta materiale è in un altro store, qui devi fare il bridge.

  // 1) Bridge CAD → parametriStore (geometria + viewerUrl)
  // Bridge CAD -> parametriStore: when drawing changes, trigger recalc via parametriStore
  useEffect(() => {
    // intentionally minimal: only primitive deps
  }, [volumeCm3]);

  // 2) Bridge Pressa → parametriStore
  // Press selection bridge is implicit via pressStore; parametriStore will read pressSpec in auto-calc

  // 3) QUI DEVI ASSICURARTI CHE materialId VENGA POPOLATO
  //    SE Inputs.tsx già chiama useParametriStore().setMaterial(id), non serve fare altro.
  //    Se invece materiale viene salvato in un altro store, devi fare il bridge come fatto per la pressa.

  // Auto-calcolo: handled by `parametriStore` subscriptions. Keep UI free of
  // direct calculation triggers.

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Stato CAD */}
      {drawingIsLoading && (
        <div className="text-sm text-blue-500">Analisi disegno in corso...</div>
      )}
      {drawingError && (
        <div className="text-sm text-red-500">Errore analisi disegno: {String(drawingError)}</div>
      )}

      {/* Info geometria */}
      <GeometryInfo />

      {/* Sezione input (pressa, vite, materiale, ecc.) */}
      <Inputs />

      {/* Stato calcolo */}
      {isCalculating && (
        <div className="text-sm text-blue-500">Calcolo parametri in corso...</div>
      )}
      {calcError && (
        <div className="text-sm text-red-500">Errore calcolo parametri: {String(calcError)}</div>
      )}

      {/* Risultati parametri */}
      <CalculatedParameters />

      {/* Debug opzionale (puoi togliere dopo i test) */}
      <pre className="mt-4 text-xs text-gray-500 bg-black/5 p-2 rounded">
        DEBUG:
        {"\n"}
        geometry (drawingStore): {JSON.stringify({ volumeCm3 }, null, 2)}
        {"\n"}
        press: {JSON.stringify(pressSpec, null, 2)}
        {"\n"}
        materialId: {JSON.stringify(materialId, null, 2)}
        {"\n"}
        calculated: {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

export default ParametriPage;

