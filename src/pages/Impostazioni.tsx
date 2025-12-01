import React from "react";
import { ToggleCloudAI } from "../components/settings/ToggleCloudAI";
import { BackupControls } from "../components/settings/BackupControls";
import { MetricsPanel } from "../components/settings/MetricsPanel";

export default function Impostazioni() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Impostazioni</h1>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Privacy &amp; AI</h2>
        <p className="text-sm opacity-80">
          Per impostazione predefinita l'applicazione lavora completamente offline.
          L'AI Cloud può essere attivata solo manualmente.
        </p>
        <ToggleCloudAI />
      </section>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Backup dati</h2>
        <p className="text-sm opacity-80">
          Esporta o importa un backup contenente CAD, analisi e miniature salvate in locale.
        </p>
        <BackupControls />
      </section>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Metriche parsing</h2>
        <p className="text-sm opacity-80">
          Panoramica sui tempi di parsing e sull'uso del worker rispetto al fallback.
        </p>
        <MetricsPanel />
      </section>
    </div>
  );
}
