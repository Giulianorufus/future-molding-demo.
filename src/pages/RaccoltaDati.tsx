import React, { useState } from "react";
import { parseProductionCsv } from "../engine/productionImport/parseProductionCsv";
import { casesFromProductionImport } from "../engine/productionImport/casesFromProductionImport";
import { useCaseStore } from "../stores/caseStore";

export default function RaccoltaDati() {
  const [report, setReport] = useState<string | null>(null);
  const addCases = useCaseStore((s) => s.bulkAddCases);

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Raccolta Dati</h1>

      <div className="bg-white shadow rounded-xl p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Importa esiti produzione (CSV)</h2>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} />

        {report ? <div className="mt-4 text-sm text-gray-700">{report}</div> : null}

      </div>
    </div>
  );
}
