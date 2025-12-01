# Runner STEP → GLB

File: `scripts/test-step-load.mjs`

Breve guida d'uso

- Requisiti:
  - Node.js 18+ (consigliato)
  - Dipendenze del progetto installate (`npm ci`)

- Uso:
```powershell
node scripts/test-step-load.mjs "C:\path\to\file.step"
```

Output
- Scrive un file GLB in `./tmp/<basename>.glb` se la conversione ha successo.
- Se `occt-import-js` non è disponibile, copia il file input in `./tmp/` come fallback.

Note tecniche
- Lo script è ESM e carica dinamicamente `occt-import-js` (se presente) per effettuare il parsing STEP/IGES.
- Per evitare problemi con i loader ESM di `three/examples`, lo script utilizza un semplice builder GLB interno per produrre un file GLB con posizioni, normali e indici.
- Se vuoi usare il loader del browser (in-app), il codice principale del progetto (vedi `src/lib/cadParser.ts`) usa `occt-import-js` con worker e gestione automatica della memoria.

Debug
- I log dell'ultima esecuzione sono salvati in `tmp/run-output.txt`.
