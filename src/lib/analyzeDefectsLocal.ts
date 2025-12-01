// Local defects analysis fallback used when OpenAI is not configured or fails.
export function analyzeDefectsLocal(data: any): string {
  const { defects } = data;
  const out: string[] = [];

  out.push("=== ANALISI DIFETTI (Motore Locale Future Molding) ===");

  if (!defects || defects.length === 0) {
    out.push("Nessun difetto segnalato.");
    return out.join("\n");
  }

  for (const d of defects) {
    const type = String(d.type || "").toLowerCase();

    out.push(`\n► DIFETTO: ${d.type}`);

    // =====================================================================
    // BAVE / SBAVATURE
    // =====================================================================
    if (["bave", "bava", "sbavatura"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Pressione mantenimento troppo alta");
      out.push("- Ritardo cambio fase");
      out.push("- Chiusura stampo insufficiente (clamp bassi)");
      out.push("- Piani non paralleli\n");

      out.push("Correzioni consigliate:");
      out.push("- Riduci pressione mantenimento -5/10%");
      out.push("- Anticipa cambio fase di 0.1–0.3s");
      out.push("- Aumenta clamp se possibile");
      out.push("- Riduci velocità step 1 di iniezione\n");
      continue;
    }

    // =====================================================================
    // MANCANZA / SHORT-SHOT
    // =====================================================================
    if (["mancanza", "short", "pezzi mancanti"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Velocità troppo bassa");
      out.push("- Melt troppo freddo");
      out.push("- Pressione max limitata\n");

      out.push("Correzioni consigliate:");
      out.push("- Aumenta velocità iniezione +10–20%");
      out.push("- Aumenta temperatura melt +5°C");
      out.push("- Aumenta pressione massima");
      out.push("- Aumenta corsa vite / shot\n");
      continue;
    }

    // =====================================================================
    // BRUCIATURE
    // =====================================================================
    if (["bruciatura", "burn", "diesel"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Aria intrappolata e compressa");
      out.push("- Velocità troppo alta");
      out.push("- Stampi non ventilati\n");

      out.push("Correzioni consigliate:");
      out.push("- Riduci velocità primo step di iniezione -15/25%");
      out.push("- Aumenta sfoghi d'aria nelle zone critiche");
      out.push("- Riduci temperatura stampo di 5°C");
      out.push("- Anticipa leggermente il cambio fase\n");
      continue;
    }

    // =====================================================================
    // LINEE ARIA / AIR TRAPS
    // =====================================================================
    if (["aria", "air", "soffiature"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Ventilazione insufficiente");
      out.push("- Riempimento troppo rapido in zone chiuse\n");

      out.push("Correzioni consigliate:");
      out.push("- Aggiungi sfoghi stampo nelle zone di ristagno");
      out.push("- Riduci velocità step 1 -10%");
      out.push("- Aumenta temperatura stampo +5°C");
      out.push("- Verifica presenza di strisciate lucide (incipiente bruciatura)\n");
      continue;
    }

    // =====================================================================
    // BOLLE / VUOTI / POROSITÀ
    // =====================================================================
    if (["bolle", "vuoti", "poros", "void"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Pressione mantenimento insufficiente");
      out.push("- Raffreddamento troppo rapido che intrappola aria");
      out.push("- Presenza di umidità o degradazione del materiale\n");

      out.push("Correzioni consigliate:");
      out.push("- Aumenta pressione mantenimento +5–15%");
      out.push("- Riduci velocità in zone di pieno e aumenta la pressione di packing");
      out.push("- Asciuga il materiale prima della produzione (se igroscopico)");
      out.push("- Verifica sia assenza di contaminazioni o agenti volatili\n");
      continue;
    }

    // =====================================================================
    // RITIRO / SINK MARKS
    // =====================================================================
    if (["ritiro", "ritiri", "sink", "sink mark", "sinkmark"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Packing/holding insufficiente");
      out.push("- Sezioni con spessore variabile");
      out.push("- Raffreddamento non uniforme\n");

      out.push("Correzioni consigliate:");
      out.push("- Aumenta pressione mantenimento +5–20%");
      out.push("- Allunga tempo mantenimento +10–30% in provino");
      out.push("- Aggiungi rinforzi o rivedi spessori nelle zone critiche\n");
      continue;
    }

    // =====================================================================
    // LINEE DI FLUSSO / FLOW LINES
    // =====================================================================
    if (["linee di flusso", "flow lines", "flowline"].some((x) => type.includes(x))) {
      out.push("Cause probabili:");
      out.push("- Ingresso materiale troppo freddo");
      out.push("- Velocità instabile in transizione tra zone\n");

      out.push("Correzioni consigliate:");
      out.push("- Aumenta melt +5/10°C");
      out.push("- Aumenta temperatura stampo +3–5°C");
      out.push("- Ottimizza profilo velocità (aumenta primo step)\n");
      continue;
    }

    // =====================================================================
    // DEFAULT
    // =====================================================================
    out.push("Difetto non riconosciuto nel motore locale.");
    out.push("Suggerimento: prova IA cloud (quando disponibile) e fornisci più dettagli su posizione/immagini/segnalazioni.");
  }

  return out.join("\n");
}
