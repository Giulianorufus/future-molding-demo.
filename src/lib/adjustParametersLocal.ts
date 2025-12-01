// Local helper to suggest adjusted injection parameters based on reported defects.
// It receives an input with current injectionParams and defects array and
// returns a new object with suggested parameter adjustments (shallow copy).
export function adjustParametersLocal(input: any): any {
  const { injectionParams = {}, defects = [] } = input || {};

  // copia parametri attuali
  const out: any = { ...injectionParams };

  for (const d of defects) {
    const type = String(d.type || "").toLowerCase();

    // ============================================================
    // BAVE / SBAVATURE
    // ============================================================
    if (["bave", "sbavatura", "bava"].some((x) => type.includes(x))) {
      out.pressioneMantenimento = (out.pressioneMantenimento || 0) * 0.9; // -10%
      out.velocitaStep1 = (out.velocitaStep1 || out.velocita || 0) * 0.95;
      out.cambioFase = (out.cambioFase || 0) - 0.1; // anticipa
      continue;
    }

    // ============================================================
    // MANCANZA / SHORT-SHOT
    // ============================================================
    if (["mancanza", "short", "pezzi mancanti"].some((x) => type.includes(x))) {
      out.velocita = (out.velocita || 0) * 1.2; // +20%
      out.pressioneMax = (out.pressioneMax || 0) * 1.15;
      out.melt = (out.melt || 0) + 5;
      out.corsaVite = (out.corsaVite || 0) + 5;
      continue;
    }

    // ============================================================
    // BRUCIATURE
    // ============================================================
    if (["bruciatura", "burn", "diesel"].some((x) => type.includes(x))) {
      out.velocitaStep1 = (out.velocitaStep1 || out.velocita || 0) * 0.8;
      out.temperaturaStampo = (out.temperaturaStampo || 0) - 5;
      out.cambioFase = (out.cambioFase || 0) - 0.1;
      continue;
    }

    // ============================================================
    // LINEE ARIA
    // ============================================================
    if (["aria", "air", "soffiature"].some((x) => type.includes(x))) {
      out.velocitaStep1 = (out.velocitaStep1 || out.velocita || 0) * 0.9;
      out.temperaturaStampo = (out.temperaturaStampo || 0) + 5;
      continue;
    }

    // ============================================================
    // BOLLE / POROSITÀ
    // ============================================================
    if (["bolle", "vuoti", "poros", "void"].some((x) => type.includes(x))) {
      out.pressioneMantenimento = (out.pressioneMantenimento || 0) * 1.2;
      out.tempoMantenimento = (out.tempoMantenimento || 0) * 1.3;
      continue;
    }

    // ============================================================
    // RITIRO / SINK MARKS
    // ============================================================
    if (["ritiro", "sink"].some((x) => type.includes(x))) {
      out.pressioneMantenimento = (out.pressioneMantenimento || 0) * 1.15;
      out.tempoMantenimento = (out.tempoMantenimento || 0) * 1.4;
      out.raffreddamento = (out.raffreddamento || 0) + 3;
      continue;
    }

    // ============================================================
    // WARPAGE / DEFORMAZIONI
    // ============================================================
    if (["warpage", "deforma", "imbarc"].some((x) => type.includes(x))) {
      out.pressioneMantenimento = (out.pressioneMantenimento || 0) * 1.1;
      out.raffreddamento = (out.raffreddamento || 0) * 1.2;
      out.velocita = (out.velocita || 0) * 0.9;
      continue;
    }

    // ============================================================
    // SALDATURE DEBOLI
    // ============================================================
    if (["weld", "saldatura"].some((x) => type.includes(x))) {
      out.melt = (out.melt || 0) + 10;
      out.velocita = (out.velocita || 0) * 1.15;
      continue;
    }

    // ============================================================
    // DELAMINAZIONE
    // ============================================================
    if (["delamin", "delam", "strati"].some((x) => type.includes(x))) {
      out.melt = (out.melt || 0) + 8;
      out.velocita = (out.velocita || 0) * 0.95;
      out.backpressure = (out.backpressure || 0) + 2;
      continue;
    }

    // ============================================================
    // DEFAULT: nessuna regola specifica, leggera stabilizzazione
    // ============================================================
    // Applichiamo piccole modifiche conservative per stimolare il processo
    out.velocita = out.velocita || (out.velocitaStep1 || 0);
  }

  return out;
}
