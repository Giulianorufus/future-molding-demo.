import React, { useState } from "react";
import { analyzeWithAI } from "../api/aiAdapter";
import type { AIAnalyzeResponse, AIDefect } from "../types/ai";
import { useParametriStore } from "../store/parametriStore";

export default function AIAssistant({ file }: { file?: File | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalyzeResponse | null>(null);
  const apply = useParametriStore((s: any) => (s as any).applyCorrection ?? (() => {}));

  async function run() {
    setLoading(true);
    try {
      const res = await analyzeWithAI(file || null, {});
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Analisi AI fallita: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(d: AIDefect) {
    if (!d.suggestedCorrections) return;
    // apply via store (rules object)
    apply(d.suggestedCorrections as any);
    alert(`Applicata correzione suggerita: ${d.label}`);
  }

  return (
    <div className="bg-white rounded p-4 shadow">
      <h3 className="font-semibold mb-2">Assistente AI</h3>
      <p className="text-sm text-gray-600 mb-3">Analizza foto/disegno e suggerisce correzioni.</p>
      <div className="flex gap-2">
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={run} disabled={loading}>
          {loading ? "Analizzo..." : "Analizza con AI"}
        </button>
      </div>

      {result?.defects?.length ? (
        <ul className="mt-3 space-y-2">
          {result.defects.map((d, i) => (
            <li key={i} className="border rounded p-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{d.label} ({Math.round(d.confidence*100)}%)</div>
                  <div className="text-sm text-gray-600">{d.explanation}</div>
                </div>
                <div>
                  <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={() => applySuggestion(d)}>Applica</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
