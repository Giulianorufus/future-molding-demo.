import React, { useState } from "react";
import { parseProductionCsv } from "../engine/productionImport/parseProductionCsv";
import { casesFromProductionImport } from "../engine/productionImport/casesFromProductionImport";
import { useCaseStore } from "../stores/caseStore";

export default function RaccoltaDati() {
  const [report, setReport] = useState<string | null>(null);
  const addCases = useCaseStore((s) => s.bulkAddCases);
  const exportCases = useCaseStore((s) => s.exportCases);
  const importCasesStore = useCaseStore((s) => s.importCases);
  const clearCases = useCaseStore((s) => s.clearCases);

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
      a.href = url;
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
            <input type="file" accept="application/json" onChange={handleImportJson} />
          </div>
          <div>
            <button className="btn btn-danger" onClick={handleClear} type="button">Svuota casi</button>
          </div>
        </div>

        {report ? <div className="mt-4 text-sm text-gray-700">{report}</div> : null}

      </div>
    </div>
  );
}
