// Central error mapping for user-facing messages
export type UserMessage = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  action?: string; // short remediation hint
};

export function mapError(err: any): UserMessage {
  const raw = String(err?.message ?? err ?? 'Errore sconosciuto');

  // common patterns
  if (/corrupt|corrotto|invalid/i.test(raw)) {
    return {
      title: 'File corrotto o non valido',
      description: 'Il file sembra corrotto o non è un file CAD valido. Prova a riesportarlo dal tuo CAD oppure usa una versione diversa del file.',
      variant: 'destructive',
      action: 'Riesporta il file da CAD oppure prova con STL/GLTF'
    };
  }

  if (/format|supportato|not support/i.test(raw)) {
    return {
      title: 'Formato non supportato',
      description: 'Carica un file in formato STEP, IGES o STL (o esporta in uno di questi formati dal tuo CAD).',
      variant: 'destructive',
      action: 'Esporta in STEP/IGES/STL'
    };
  }

  if (/memory|out of memory|allocation/i.test(raw)) {
    return {
      title: 'Risorse insufficienti',
      description: 'Il file è troppo grande per l’elaborazione nel browser. Prova a semplificarlo o usarne una versione con meno dettagli.',
      variant: 'warning',
      action: 'Semplifica mesh / usa parti separate'
    };
  }

  if (/worker|timeout|Unknown worker error/i.test(raw)) {
    return {
      title: 'Errore parsing in background',
      description: 'Il parsing in background è fallito; verrà eseguito un tentativo alternativo in primo piano. Se il problema persiste, prova a convertire il file.',
      variant: 'warning',
      action: 'Riprova o usa un file semplificato'
    };
  }

  // occt-specific hints
  if (/occt|readStepFile|readStlFile|readIgesFile/i.test(raw)) {
    return {
      title: 'Errore libreria CAD',
      description: 'Si è verificato un errore interno durante la lettura del file CAD. Controlla il file o prova con una versione esportata diversamente.',
      variant: 'destructive',
      action: 'Riesporta in un formato diverso o riduci la complessità'
    };
  }

  // fallback
  return {
    title: 'Errore durante l’operazione',
    description: raw,
    variant: 'destructive',
    action: 'Riprova o contatta supporto'
  };
}

export default mapError;
