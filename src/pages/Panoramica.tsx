import React, { useMemo } from "react";

type Pane = { title: string; path: string };

export default function Panoramica() {
  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    return window.location.origin + window.location.pathname;
  }, []);

  const panes: Pane[] = [
    { title: "Parametri", path: "#/parametri" },
    { title: "Disegni", path: "#/disegni" },
    { title: "Dashboard", path: "#/dashboard" },
    { title: "Difetti", path: "#/difetti" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Panoramica Progetto</h1>
      <p className="text-sm text-slate-600 mb-4">
        Anteprima simultanea delle aree principali dell'applicazione.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {panes.map((p) => (
          <div key={p.title} className="border rounded bg-white overflow-hidden shadow-sm">
            <div className="px-3 py-2 text-sm font-medium border-b bg-slate-50">{p.title}</div>
            <div className="aspect-[16/10]">
              <iframe
                title={p.title}
                src={`${baseUrl}${p.path}`}
                className="w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

