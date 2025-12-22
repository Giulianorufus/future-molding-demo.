import type { CaseQuery, CaseRecord, SimilarityResult } from "./caseTypes";
import { scoreCaseSimilarity } from "./similarity";

export function findSimilarCases(query: CaseQuery, cases: CaseRecord[], topK = 5): SimilarityResult[] {
  const scored = cases.map((c) => scoreCaseSimilarity(query, c));

  // tie-break deterministico: score desc, createdAt desc, caseId asc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const ca = cases.find((x) => x.id === a.caseId);
    const cb = cases.find((x) => x.id === b.caseId);
    const da = ca?.createdAt ?? "";
    const db = cb?.createdAt ?? "";
    if (db !== da) return db.localeCompare(da);

    return a.caseId.localeCompare(b.caseId);
  });

  return scored.slice(0, Math.max(0, topK));
}
