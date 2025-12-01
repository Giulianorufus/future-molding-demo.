import React, { useState } from "react";
import { isCloudAIEnabled } from "../../config/appConfig";
import { useAppStore } from "@/store/appStore";
import { useDrawingStore } from "@/store/drawingStore";

type Suggestion = {
  id: string;
  type: string;
  confidence: number;
  recommendation?: string;
  rationale?: string;
};

export default function DefectsAssistant() {
  const { selectedMaterial } = useAppStore();
  const { selectedDrawingId } = useDrawingStore();

  const [features, setFeatures] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    setSuggestions([]);
    try {
      if (!isCloudAIEnabled()) {
        setError('AI Cloud è disabilitata nelle impostazioni. Abilitala per usare questo servizio.');
        return;
      }
      const body = {
        drawingId: selectedDrawingId || undefined,
        materialId: selectedMaterial ? (selectedMaterial as any).id ?? (selectedMaterial as any).name : undefined,
        features: features || undefined,
        maxResults: 6,
      };

      const resp = await fetch("/api/ai/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `HTTP ${resp.status}`);
      }
      const data = await resp.json();

      // data.result may contain { suggestions: [...] } or raw openai output
      let items: Suggestion[] = [];
      if (data?.result?.suggestions && Array.isArray(data.result.suggestions)) {
        items = data.result.suggestions.map((s: any, i: number) => ({ id: s.id ?? `ai-${i}`, type: s.type ?? s.name ?? "Unknown", confidence: Number(s.confidence ?? 0), recommendation: s.recommendation, rationale: s.rationale }));
      } else if (data?.result?.raw && typeof data.result.raw === "string") {
        // try to parse JSON inside raw
        try {
          const parsed = JSON.parse(data.result.raw);
          if (parsed?.suggestions) items = parsed.suggestions;
        } catch {
          // fallback: show raw as single suggestion
          items = [{ id: "raw-1", type: "Analisi AI (raw)", confidence: 0, recommendation: data.result.raw }];
        }
      } else if (data?.result?.suggestions) {
        items = data.result.suggestions;
      } else if (data?.suggestions) {
        items = data.suggestions;
      } else {
        throw new Error("Risposta non riconosciuta dal servizio AI");
      }

      setSuggestions(items as Suggestion[]);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded p-4 space-y-4">
      <h3 className="text-lg font-semibold">AI Defects Assistant</h3>

      <p className="text-sm text-gray-600">Usa questo strumento per ottenere suggerimenti automatizzati sui possibili difetti e raccomandazioni tecniche.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contesto (opzionale)</label>
          <div className="text-xs text-gray-500">Disegno selezionato: {selectedDrawingId || "-"} · Materiale: {(selectedMaterial as any)?.name ?? "-"}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Osservazioni / caratteristiche rilevate</label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="Esempio: bolle vicino alla nervatura, segni di sink mark, sezioni sottili..."
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            onClick={(e) => handleSubmit(e)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Analisi in corso…" : "Analizza"}
          </button>
          <button
            type="button"
            onClick={() => { setFeatures(""); setSuggestions([]); setError(null); }}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
          >
            Reset
          </button>
        </div>
      </form>

      <div>
        {error && <div className="text-red-600 text-sm">Errore: {error}</div>}

        {suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <h4 className="font-medium">Suggerimenti</h4>
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li key={s.id} className="border p-3 rounded">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-semibold">{s.type}</div>
                      <div className="text-xs text-gray-500">Confidenza: {(s.confidence ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(s.recommendation ?? s.rationale ?? s.type); }}
                        className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Copia raccomandazione
                      </button>
                    </div>
                  </div>
                  {s.recommendation && <div className="mt-2 text-sm text-gray-700">🔧 {s.recommendation}</div>}
                  {s.rationale && <div className="mt-1 text-xs text-gray-500">ℹ️ {s.rationale}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
