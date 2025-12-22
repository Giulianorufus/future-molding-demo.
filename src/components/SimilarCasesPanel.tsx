import React from "react";
import type { RecipeSnapshot } from "../engine/recipeExport/recipeTypes";
import { buildCaseQueryFromSnapshot } from "../engine/caseBased";
import { useCaseStore } from "../stores/caseStore";

type Props = {
  snapshot: RecipeSnapshot | null;
  topK?: number;
};

export default function SimilarCasesPanel({ snapshot, topK = 5 }: Props) {
  const findSimilar = useCaseStore((s) => s.findSimilar);

  if (!snapshot) return null;

  const query = buildCaseQueryFromSnapshot(snapshot);
  const results = findSimilar(query, topK);

  if (!results || results.length === 0) return null;

  if (import.meta.env.DEV) {
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
            <th>Score</th>
            <th>Reasons</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const parts = r.caseId.split(":");
            const label = parts.length >= 3 ? parts[2] : r.caseId.slice(0, 8);
            return (
              <tr key={r.caseId} className="border-t">
                <td className="py-2 font-mono">{label}</td>
                <td className="py-2">{r.score}</td>
                <td className="py-2 text-gray-700">{r.reasons.join(" • ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
