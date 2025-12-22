import React from "react";
import type { RecipeSnapshot } from "../engine/recipeExport/recipeTypes";
import { buildCaseQueryFromSnapshot } from "../engine/caseBased";
import { useCaseStore } from "../stores/caseStore";
import { useParametriStore } from "../stores/parametriStore";

type Props = {
  snapshot: RecipeSnapshot | null;
  topK?: number;
};

export default function SimilarCasesPanel({ snapshot, topK = 5 }: Props) {
  const findSimilar = useCaseStore((s) => s.findSimilar);
  const baselineCaseId = useParametriStore((s) => s.baselineCaseId);
  const applyBaselineFromCase = useParametriStore((s) => s.applyBaselineFromCase);

  if (!snapshot) return null;

  const query = buildCaseQueryFromSnapshot(snapshot);
  const results = findSimilar(query, topK);

  if (!results || results.length === 0) return null;

  if (process.env.NODE_ENV !== "production") {
    try {
      const casesLen = useCaseStore.getState().cases.length;
      // eslint-disable-next-line no-console
      console.debug('[SimilarCasesPanel] DEV: cases=', casesLen, 'query=', query, 'top0=', results[0]);
    } catch (_) {}
  }

  return (
    <div data-testid="similar-cases-panel" className="mt-6 bg-white p-4 shadow rounded max-w-3xl">
      <h2 className="text-xl font-semibold mb-3">Casi simili</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th>Case</th>
            <th>Preview</th>
            <th>Score</th>
            <th>Reasons</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const parts = r.caseId.split(":");
            const label = parts.length >= 3 ? parts[2] : r.caseId.slice(0, 8);
            const caseRecord = useCaseStore.getState().cases.find((c) => c.id === r.caseId) as any;
            return (
              <tr key={r.caseId} className="border-t">
                <td className="py-2 font-mono">
                  {label}
                  {baselineCaseId === r.caseId ? <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Baseline</span> : null}
                </td>
                <td className="py-2 text-gray-700">
                  <div className="text-sm">
                    <div><strong>Mat:</strong> {caseRecord?.recipeSnapshot?.material?.id ?? caseRecord?.materialId ?? '--'}</div>
                    <div><strong>Pressa/Vite:</strong> {caseRecord?.recipeSnapshot?.press?.model ?? caseRecord?.pressId ?? '--'} {caseRecord?.recipeSnapshot?.press?.screwDiameter_mm ? ` / ${caseRecord.recipeSnapshot.press.screwDiameter_mm}mm` : (caseRecord?.screwDiameter_mm ? ` / ${caseRecord.screwDiameter_mm}mm` : '')}</div>
                    <div><strong>Esito:</strong> {caseRecord?.outcome?.producedQty ?? '--'} prod · {caseRecord?.outcome?.scrapQty ?? '--'} scrap</div>
                    <div><strong>Cycle/cooling:</strong> {caseRecord?.outcome?.cycleTime_s ? `${caseRecord.outcome.cycleTime_s}s` : (caseRecord?.recipeSnapshot?.output?.times ? `${caseRecord.recipeSnapshot.output.times.injectionMs ?? '--'}ms / ${caseRecord.recipeSnapshot.output.times.coolingMs ?? '--'}ms` : '--')}</div>
                    <div><strong>Switchover:</strong> {caseRecord?.recipeSnapshot?.output?.switchover_volumePercent ?? caseRecord?.recipeSnapshot?.output?.switchover ?? caseRecord?.recipeSnapshot?.input?.injection?.switchover ?? (caseRecord?.recipeSnapshot?.output?.injectionProfile ? `${caseRecord.recipeSnapshot.output.injectionProfile.length} steps` : '--')}</div>
                  </div>
                </td>
                <td className="py-2">{r.score}</td>
                <td className="py-2 text-gray-700">{r.reasons.join(" • ")}</td>
                <td className="py-2">
                  <button
                    onClick={() => {
                      if (caseRecord) applyBaselineFromCase(caseRecord);
                    }}
                    type="button"
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Applica
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
