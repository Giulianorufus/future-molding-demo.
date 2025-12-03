import React from "react";
import { useParametriStore } from "../../store/parametriStore";

export default function CalculatedParameters({ result }: { result?: any }) {
  const storeResult = useParametriStore((s: any) => s.calculated);
  const results = storeResult ?? result;

  if (!results) {
    return (
      <div className="text-center text-gray-400 p-8">
        Nessun calcolo disponibile.
        Esegui prima “Calcola Parametri”.
      </div>
    );
  }

  // Map common fields from the store's calculated output
  const volumePezzo = results.pieceVolumeCm3 ?? results.volumePezzo ?? results.volumePezzo_cm3 ?? "--";
  const volumeMaterozza = results.runnerVolumeCm3 ?? results.volumeMaterozza ?? results.volumeMaterozza_cm3 ?? "--";
  const volumeTotale = results.shotVolumeCm3 ?? results.volumeTotale ?? results.volumeTotale_cm3 ?? "--";
  const areaProiettata = results.projAreaCm2 ?? results.areaProiettata ?? "--";
  const spessoreMedio = results.spessoreMedio ?? results.spessoreMedio_mm ?? "--";

  const velIniezione = results.velIniezione ?? results.suggestedInjectionSpeedCm3s ?? results.injectionSpeed_cm3s ?? "--";
  const pressioneIniezione = results.pressioneIniezione ?? results.computedInjectionPressure_bar ?? results.injectionPressure_bar ?? "--";
  const fillTime = results.fillTime ?? results.fillTime_s ?? "--";

  const vp = results.vp ?? results.vpComputed_cm3 ?? results.vp_cm3 ?? "--";

  const packPressione = results.packPressione ?? results.pack_bar ?? results.packPressureBar ?? "--";
  const packTempo = results.packTempo ?? results.pack_s ?? results.packTimeSec ?? "--";

  const coolingTime = results.coolingTime ?? results.cooling_s ?? "--";

  const velocitaVite = results.velocitaVite ?? results.rpm ?? results.screwRpm ?? "--";
  const contropressione = results.contropressione ?? results.backpressure_bar ?? results.backPressureBar ?? "--";
  const tempoDosatura = results.tempoDosatura ?? results.plastificationTimeSec ?? "--";

  const tonnellaggio = results.tonnellaggio ?? results.requiredTonnage_t ?? "--";
  const tonnellaggioPressa = results.tonnellaggioPressa ?? results.clampForceTon ?? "--";

  const temperature = results.temperature ?? {};
  const suggerimenti = results.suggerimenti ?? results.suggestions ?? [];

  return (
    <div className="space-y-6 p-6">

      {/* GEOMETRIA */}
      <Section title="Geometria (dal disegno)">
        <Row label="Volume pezzo" value={`${volumePezzo} cm³`} />
        <Row label="Volume materozza" value={`${volumeMaterozza} cm³`} />
        <Row label="Volume totale iniezione" value={`${volumeTotale} cm³`} />
        <Row label="Area proiettata" value={`${areaProiettata} cm²`} />
        <Row label="Spessore medio" value={`${spessoreMedio} mm`} />
      </Section>

      {/* INIEZIONE */}
      <Section title="Iniezione">
        <Row label="Velocità iniezione" value={`${velIniezione} cm³/s`} />
        <Row label="Pressione iniezione" value={`${pressioneIniezione} bar`} />
        <Row label="Fill Time" value={`${fillTime} s`} />
      </Section>

      {/* VP */}
      <Section title="Commutazione (VP Volume)">
        <Row label="VP volume" value={`${vp} cm³`} />
        <Row label="Pressione VP" value={`${pressioneIniezione} bar`} />
      </Section>

      {/* PACK */}
      <Section title="Post-pressione (Pack)">
        <Row label="Pressione pack" value={`${packPressione} bar`} />
        <Row label="Tempo pack" value={`${packTempo} s`} />
      </Section>

      {/* RAFFREDDAMENTO */}
      <Section title="Raffreddamento">
        <Row label="Tempo raffreddamento" value={`${coolingTime} s`} />
      </Section>

      {/* PLASTIFICAZIONE */}
      <Section title="Plastificazione">
        <Row label="Velocità vite" value={`${velocitaVite ?? "-"} mm/s`} />
        <Row label="Contropressione" value={`${contropressione ?? "-"} bar`} />
        <Row label="Tempo dosatura" value={`${tempoDosatura ?? "-"} s`} />
      </Section>

      {/* TONNELLAGGIO */}
      <Section title="Tonnellaggio">
        <Row label="Richiesto" value={`${tonnellaggio} kN`} />
        <Row label="Disponibile (pressa)" value={`${tonnellaggioPressa ?? "-"} kN`} />
      </Section>

      {/* TEMPERATURE */}
      <Section title="Temperature">
        <Row label="Cilindro Z1" value={`${temperature?.z1 ?? temperature?.suggestedMeltTempC ?? "-"} °C`} />
        <Row label="Cilindro Z2" value={`${temperature?.z2 ?? "-"} °C`} />
        <Row label="Cilindro Z3" value={`${temperature?.z3 ?? "-"} °C`} />
        <Row label="Cilindro Z4" value={`${temperature?.z4 ?? "-"} °C`} />
        <Row label="Stampo" value={`${temperature?.stampo ?? temperature?.suggestedMoldTempC ?? "-"} °C`} />
        <Row label="Ugello" value={`${temperature?.ugello ?? "-"} °C`} />
      </Section>

      {/* SUGGERIMENTI */}
      {suggerimenti && suggerimenti.length > 0 && (
        <Section title="Suggerimenti intelligenti">
          <ul className="list-disc ml-6 text-sm text-gray-300">
            {suggerimenti.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

    </div>
  );
}

/* COMPONENTI UI INDUSTRIALI (senza modificare grafica del progetto) */

function Section({ title, children }: any) {
  return (
    <div className="bg-[#0b1f30] p-4 rounded-lg border border-yellow-500">
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

