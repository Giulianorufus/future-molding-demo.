import React, { useState } from "react";
import { isCloudAIEnabled } from "../../config/appConfig";
import { useAppStore } from "@/store/appStore";
import { useDrawingStore } from "@/store/drawingStore";

export default function AIDefectsAssistant() {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("");

  const {
    marca,
    modello,
    selectedMaterial,
    injectionParams,
    calculationResult,
    defects,
    updateParams,
  } = useAppStore();

  const { selectedDrawingId } = useDrawingStore();

  async function analyze() {
    setLoading(true);
    setReply("");
    setSource("");

    const body = {
      drawingName: localStorage.getItem("fm_drawing_name") || "",
      material: selectedMaterial,
      press: { marca, modello },
      injectionParams,
      geometry: {
        volume: (calculationResult as any)?.volumeCavita,
        spessore: (injectionParams as any)?.spessore,
      },
      defects,
    };

    try {
      if (!isCloudAIEnabled()) {
        setReply('AI Cloud è disabilitata nelle impostazioni. Abilitala per usare questo servizio.');
        setSource('local-disabled');
        return;
      }

      const res = await fetch("/api/ai/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setReply(data.result || data.error || "Nessuna risposta");
      setSource(data.source || "");
    } catch (err: any) {
      setReply(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function autoAdjust() {
    setLoading(true);
    setReply("");
    setSource("");

    try {
      // First try internal params route
      let data: any = null;
      try {
        const res = await fetch("/api/params/auto-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ injectionParams: injectionParams ?? {}, defects }),
        });
        if (res.ok) data = await res.json();
      } catch (e) {
        // ignore and try external endpoint next
      }

      // If internal didn't return params, try the user's provided endpoint
      if (!data?.params) {
        try {
          // external/local AI endpoint provided by user; only call if cloud/local AI allowed
          if (!isCloudAIEnabled()) throw new Error('External AI endpoint disabled by configuration');

          const res2 = await fetch("http://localhost:4000/api/ai/auto-params", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ injectionParams: injectionParams ?? {}, defects }),
          });
          if (res2.ok) data = await res2.json();
        } catch (e) {
          // both attempts failed
        }
      }

      if (data?.params) {
        updateParams(data.params);
        setReply("Parametri aggiornati con successo.");
        setSource(data.source || "auto-params");
      } else if (data) {
        setReply(data?.message || "Nessun parametro suggerito.");
        setSource(data?.source || "auto-params");
      } else {
        setReply("Nessuna risposta dal server per auto-params.");
      }
    } catch (err: any) {
      setReply(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/70 p-4 rounded-xl border border-white/10 space-y-2">
      <h2 className="text-yellow-300 font-semibold">Assistente Difetti (IA Locale + Cloud Ready)</h2>

      <button
        disabled={loading}
        onClick={analyze}
        className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50"
      >
        {loading ? "Analisi in corso..." : "Analizza difetti"}
      </button>

      <button
        onClick={autoAdjust}
        disabled={loading}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-400 disabled:opacity-50"
      >
        Correggi parametri automaticamente
      </button>

      {source && (
        <div className="text-xs text-slate-400">Sorgente: {source === "local" ? "Motore Locale" : "IA Cloud"}</div>
      )}

      {reply && (
        <pre className="bg-black/40 text-yellow-100 p-3 rounded-lg text-sm whitespace-pre-wrap">{reply}</pre>
      )}
    </div>
  );
}
