// src/components/ExportRecipeButton.tsx
import React from 'react';
import { useParametriStore } from '../stores/parametriStore';
import { buildRecipeSnapshot } from '../engine/recipeExport/buildRecipeSnapshot';
import { exportRecipeJson } from '../engine/recipeExport/exportRecipeJson';
import { exportRecipeCsv } from '../engine/recipeExport/exportRecipeCsv';
import { exportRecipePdf } from '../engine/recipeExport/exportRecipePdf';
import type { RecipeSnapshot } from '../engine/recipeExport/recipeTypes';
import { useDrawingStore } from '../stores/drawingStore';
import { materialLibrary } from '../data/materialLibrary';
import { useMaterialStore } from '../stores/materialStore';
import { usePressStore } from '../stores/pressStore';
import { downloadBlob } from '../utils/download';

export function buildExportRecipeSnapshot({
  input,
  output,
  drawing,
  press,
  screwDiameterMm,
  material,
}: {
  input: Record<string, any> | null;
  output: Record<string, any> | null;
  drawing: ReturnType<typeof useDrawingStore.getState>;
  press: { id: string; name: string; tonnellaggio: number; shotVolumeCm3: number; maxPressureBar: number; maxSpeedMmPerS: number } | null;
  screwDiameterMm: number | null;
  material: { id: string; name: string; densityGPerCm3?: number; meltIndex?: number | null; recommendedTemperatureC?: number | null } | null;
}): RecipeSnapshot {
  const canonicalMaterial = material ? materialLibrary.byId(material.id) : undefined;
  const densityGPerCm3 = material?.densityGPerCm3 ?? canonicalMaterial?.density_g_cm3;
  return buildRecipeSnapshot({
    input: {
      ...(input ?? {}),
      ...(typeof output?.shotVolumeCm3 === 'number' ? { shotVolumeCm3: output.shotVolumeCm3 } : {}),
      cad: {
        volumeCm3: drawing.volumeCm3,
        projectedAreaCm2: drawing.surfaceCm2,
        boundingBoxMm: drawing.boundingBox,
        sourceFormat: drawing.conversionId ? 'STEP/IGES' : undefined,
      },
      mold: {
        cavityCount: drawing.cavityCount,
        feedSystem: drawing.feedSystem,
        runnerVolumeCm3: drawing.runnerVolumeCm3,
        runnerProjectedAreaCm2: drawing.runnerProjectedAreaCm2,
      },
    },
    output: output ?? {},
    press: press
      ? {
          id: press.id,
          model: press.name,
          screwDiameter_mm: screwDiameterMm ?? undefined,
          limits: {
            tonnellaggio: press.tonnellaggio,
            shotVolumeCm3: press.shotVolumeCm3,
            maxPressureBar: press.maxPressureBar,
            maxSpeedMmPerS: press.maxSpeedMmPerS,
          },
        }
      : undefined,
    material: material
      ? {
          id: material.id,
          name: material.name,
          factors: {
            densityGPerCm3: densityGPerCm3 ?? 0,
            meltIndex: material.meltIndex ?? canonicalMaterial?.mvr_g_10min?.typical ?? 0,
            recommendedTemperatureC: material.recommendedTemperatureC ?? canonicalMaterial?.meltTemp_C.typical ?? 0,
          },
        }
      : undefined,
    warnings: (output as any)?.warnings ?? [],
    assumptions: (output as any)?.assumptions ?? [],
    defect: (output as any)?.defect ?? null,
  });
}

export function ExportRecipeButton() {
  const lastInput = useParametriStore((s) => s.lastInput);
  const result = useParametriStore((s) => s.result ?? s.lastCalcResult);
  const drawing = useDrawingStore();
  const press = usePressStore((s) => s.selectedPressId ? s.catalog[s.selectedPressId] ?? null : null);
  const screwDiameterMm = usePressStore((s) => s.selectedScrewDiameter_mm);
  const material = useMaterialStore((s) => s.selectedMaterialId ? s.catalog[s.selectedMaterialId] ?? null : null);

  const onClick = async () => {
    const snapshot = buildExportRecipeSnapshot({ input: lastInput, output: result, drawing, press, screwDiameterMm, material });

    const json = exportRecipeJson(snapshot);
    downloadBlob('recipe.json', new Blob([json], { type: 'application/json' }));

    const csv = exportRecipeCsv(snapshot);
    downloadBlob('recipe.csv', new Blob([csv], { type: 'text/csv' }));

    const pdfBytes = await exportRecipePdf(snapshot);
    downloadBlob('recipe.pdf', pdfBytes);
  };

  return (
    <button className="btn btn-primary" onClick={onClick} disabled={!result}>Esporta ricetta</button>
  );
}

export default ExportRecipeButton;
