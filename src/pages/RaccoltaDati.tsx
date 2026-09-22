import React, { useState } from "react";
import { parseProductionCsv } from "../engine/productionImport/parseProductionCsv";
import { casesFromProductionImport } from "../engine/productionImport/casesFromProductionImport";
import { useCaseStore } from "../stores/caseStore";
import { computeGateFreeze, GateFreezePoint } from "../engine/gateFreeze/gateFreezeStudy";

export default function RaccoltaDati() {
  const [report, setReport] = useState<string | null>(null);
  const addCases = useCaseStore((s) => s.bulkAddCases);
  const exportCases = useCaseStore((s) => s.exportCases);
  const importCasesStore = useCaseStore((s) => s.importCases);
  const clearCases = useCaseStore((s) => s.clearCases);
  const allCases = useCaseStore((s) => s.cases);
  const [groupBy, setGroupBy] = useState<"fingerprint" | "partName" | "materialId">("fingerprint");
  const [gfResults, setGfResults] = useState<
    | { groupKey: string; result: ReturnType<typeof computeGateFreeze> }[]
    | null
  >(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = parseProductionCsv(text);
      const cases = casesFromProductionImport({ rows: parsed.rows });
      addCases(cases);
      setReport(`Importati ${cases.length} casi, warnings: ${parsed.warnings.length}`);
    } catch (err: any) {
      setReport(`Errore import: ${String(err.message || err)}`);
    }
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      importCasesStore(text, { merge: true });
      setReport(`Importati casi JSON da file: ${f.name}`);
    } catch (err: any) {
      setReport(`Errore import JSON: ${String(err.message || err)}`);
    }
  }

  function handleExport() {
    try {
      const json = exportCases();
      const now = new Date();
      const name = `cases_${now.toISOString().replace(/[:.]/g, "-")}.json`;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; // No-op change for context
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setReport(`Esportati casi in ${name}`);
    } catch (err: any) {
      setReport(`Errore export: ${String(err.message || err)}`);
    }
  }

  function handleClear() {
    clearCases();
    setReport("Casi svuotati");
  }

  function getGroupKey(c: any, by: "fingerprint" | "partName" | "materialId") {
    if (by === "fingerprint") {
      return c.recipeFingerprint ?? c.recipeSnapshot?.meta?.recipeFingerprint ?? c.id;
    }
    if (by === "partName") {
      return c.recipeSnapshot?.meta?.projectName ?? c.recipeSnapshot?.meta?.recipeFingerprint ?? c.recipeFingerprint ?? c.id;
    }
    // materialId
    return c.materialId ?? c.recipeFingerprint ?? c.id;
  }

  function computeAndSet(by: "fingerprint" | "partName" | "materialId") {
    try {
      const groups: Record<string, GateFreezePoint[]> = {};
      for (const c of allCases) {
        const outcome: any = (c as any).outcome ?? {};
        const t = Number(outcome?.holdingTime_s ?? outcome?.holdingTime ?? NaN);
        if (!Number.isFinite(t)) continue;
        const weight = Number(outcome?.partWeight_g ?? outcome?.weight_g ?? outcome?.cycleTime_s ?? NaN);
        const gp = getGroupKey(c, by) ?? c.id;
        groups[gp] = groups[gp] || [];
        groups[gp].push({ holdingTime_s: t, weight_g: Number.isFinite(weight) ? weight : undefined, sourceId: c.id });
      }

      const out: { groupKey: string; result: ReturnType<typeof computeGateFreeze> }[] = [];
      for (const k of Object.keys(groups)) {
        if (!groups[k] || groups[k].length === 0) continue;
        const res = computeGateFreeze(groups[k] as GateFreezePoint[]);
        out.push({ groupKey: k, result: res });
      }
      setGfResults(out.length ? out : null);
      setReport(out.length ? `Calcolati ${out.length} gruppi Gate Freeze` : "Nessun dato valido per Gate Freeze");
    } catch (err: any) {
      setReport(`Errore calcolo Gate Freeze: ${String(err?.message ?? err)}`);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Raccolta Dati</h1>

      <div className="bg-white shadow rounded-xl p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Importa esiti produzione (CSV)</h2>

        <div className="flex gap-4 items-center">
          <div>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          </div>
          <div>
            <button className="btn" onClick={handleExport} type="button">Esporta casi (JSON)</button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Raggruppa per</label>
              <select
                aria-label="group-by"
                className="input"
                value={groupBy}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setGroupBy(v);
                  // ricalcola immediatamente con il nuovo criterio
                  computeAndSet(v as "fingerprint" | "partName" | "materialId");
                }}
              >
                <option value="fingerprint">Fingerprint</option>
                <option value="partName">Part name</option>
                <option value="materialId">Material ID</option>
              </select>

              <button
                className="btn"
                type="button"
                onClick={() => computeAndSet(groupBy)}
              >
                Calcola Gate Freeze
              </button>
            </div>
          </div>
          <div>
            <input type="file" accept="application/json" onChange={handleImportJson} />
          </div>
          <div>
            <button className="btn btn-danger" onClick={handleClear} type="button">Svuota casi</button>
          </div>
        </div>

        {report ? <div className="mt-4 text-sm text-gray-700">{report}</div> : null}

        {gfResults ? (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Gate Freeze - Risultati</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pr-4">Gruppo</th>
                    <th className="pr-4">Holding s</th>
                    <th className="pr-4">Confidenza</th>
                    <th className="pr-4">Metodo</th>
                  </tr>
                </thead>
                <tbody>
                  {gfResults.map((g) => (
                    <tr key={g.groupKey} className="border-t">
                      <td className="pr-4 py-2 break-words max-w-xs">{g.groupKey}</td>
                      <td className="pr-4 py-2">{g.result.recommendedHoldingTime_s.toFixed(2)}</td>
                      <td className="pr-4 py-2">{Math.round((g.result.confidence || 0) * 100)}%</td>
                      <td className="pr-4 py-2">{g.result.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
