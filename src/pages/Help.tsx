import React from "react";

export default function Help() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Guida e Supporto</h1>
      <ul className="list-disc ml-6 space-y-2 text-base">
        <li>Carica un disegno 3D per iniziare un nuovo progetto.</li>
        <li>Seleziona la pressa, il modello e il materiale.</li>
        <li>Premi "Calcola" per ottenere i parametri ottimali.</li>
        <li>Consulta la sezione "Difetti" per suggerimenti automatici.</li>
        <li>Accedi allo storico per rivedere i progetti passati.</li>
        <li>Contatta l'amministratore per problemi di accesso o dati macchina.</li>
      </ul>
    </div>
  );
}
