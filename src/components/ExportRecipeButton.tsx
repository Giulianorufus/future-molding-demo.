// src/components/ExportRecipeButton.tsx
import React from 'react';
import { useParametriStore } from '../stores/parametriStore';
import { buildRecipeSnapshot } from '../engine/recipeExport/buildRecipeSnapshot';
import { exportRecipeJson } from '../engine/recipeExport/exportRecipeJson';
import { exportRecipeCsv } from '../engine/recipeExport/exportRecipeCsv';
import { exportRecipePdf } from '../engine/recipeExport/exportRecipePdf';
import { downloadBlob } from '../utils/download';

export function ExportRecipeButton() {
  const lastCalcInput = useParametriStore((s: any) => s.lastCalcInput);
  const lastCalcResult = useParametriStore((s: any) => s.lastCalcResult);
  const projectName = useParametriStore((s: any) => s.projectName) ?? null;

  const onClick = async () => {
    const snapshot = buildRecipeSnapshot({
      projectName,
      input: lastCalcInput ?? {},
      output: lastCalcResult ?? {},
      press: (lastCalcInput as any)?.press ?? (lastCalcResult as any)?.press ?? undefined,
      material: (lastCalcInput as any)?.material ?? (lastCalcResult as any)?.material ?? undefined,
      warnings: (lastCalcResult as any)?.warnings ?? [],
      assumptions: (lastCalcResult as any)?.assumptions ?? [],
      defect: (lastCalcResult as any)?.defect ?? null,
      appVersion: (import.meta as any).env?.VITE_APP_VERSION ?? "dev",
    });

    const json = exportRecipeJson(snapshot);
    downloadBlob('recipe.json', new Blob([json], { type: 'application/json' }));

    const csv = exportRecipeCsv(snapshot);
    downloadBlob('recipe.csv', new Blob([csv], { type: 'text/csv' }));

    const pdfBytes = await exportRecipePdf(snapshot);
    downloadBlob('recipe.pdf', pdfBytes);
  };

  return (
    <button className="btn btn-primary" onClick={onClick}>Export recipe</button>
  );
}

export default ExportRecipeButton;
