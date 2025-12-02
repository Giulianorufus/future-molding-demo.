# Verifica manuale finale — Future Molding

Queste istruzioni guidano i controlli manuali da eseguire dopo la rimozione dei componenti 3D obsoleti e la migrazione al nuovo flusso `cadStore` + `cadPipeline`.

Prerequisiti
- Node 18+ (come nel progetto)
- Dipendenze installate: `npm install`

Comandi utili (PowerShell)
```powershell
# avvia il dev server (apre Vite su 127.0.0.1:3000)
npm run dev

# typecheck
npx tsc --noEmit

# test unit
npm test
```

1) Controlli rapidi a freddo (prima di aprire l'app)
- Verifica che `npx tsc --noEmit` non ritorni errori.
- Verifica che `npm test` passi (0 testi falliti).

2) Avvio app e flusso upload → analisi → viewer
- Avvia `npm run dev`.
- Apri il browser su `http://127.0.0.1:3000` (o l'URL mostrato dalla console Vite).
- Vai alla pagina **Parametri** (upload CAD):
  - Carica un file CAD supportato (STEP/IGES/STL/GLB).
  - Osserva la progress bar / spinner di analisi.
  - Dopo l'analisi verifica che nella UI compaiano: `volume` (cm³), `area proiettata` (cm²), `thickness avg` (mm).
  - Apri la console del browser (F12) e verifica che non compaiano errori relativi a viewer deprecati (es. riferimenti a `Difetti3D` o `ModelViewer`).

3) Verifica `viewerUrl` e visualizzatore unico
- Dovresti vedere il viewer (ThreeViewer) caricare il modello. Controlla che:
  - `viewerUrl` provenga da `useCadStore` (apri React DevTools / console e verifica lo stato se necessario).
  - Non ci siano richiami ad altri viewer obsoleti.

4) Pagina Difetti
- Vai a **Difetti**:
  - Verifica che la pagina utilizzi il nuovo flusso: `DefectAI` / `DefectList` con `ThreeViewer` integrato.
  - Aggiungi una segnalazione difetto se il flusso lo permette e controlla che i parametri vengano passati correttamente a `parametriStore`.

5) Casi di errore e fallback
- Carica un file corrotto o non supportato: verifica che il sistema mostri un messaggio di errore (non crash) e che venga generato un fallback `viewerUrl` (object URL) quando possibile.
- Carica file grandi (es. +50MB): verifica che il browser non vada in crash e che l'analisi lavori con progress indication.

6) Controlli di cleanup statico (ricerca riferimenti ai vecchi componenti)
Esegui queste ricerche dalla radice del progetto per assicurarti che non restino import ai file eliminati:
```powershell
Select-String -Path src/** -Pattern "Difetti3D|DifettiAnnotator3D|AIDefectsAssistant|DefectsAssistant|DefectPicker" -SimpleMatch
```
Non dovrebbero esserci risultati.

7) Verifica codice e test CI locali
- Esegui `npx tsc --noEmit` e `npm test` un'ultima volta.

8) Azioni consigliate dopo verifica OK
- Crea un commit e una PR con le modifiche e il changelog.
- In PR: aggiungi note che Block 1–6 sono completati e includi link alle issue/cambi di architettura.

Problemi comuni e rimedi
- Se trovi import mancanti o errori di tipo dopo aver cancellato file: verifica se qualche file consumer non è stato aggiornato (cerca import stringhe dirette verso i file rimossi).
- Se il viewer non appare: apri la console e cerca `viewerUrl` nello stato (React DevTools) e verifica che la risorsa GLB/STL sia raggiungibile.

Supporto
- Se vuoi, posso generare la PR con le modifiche già committate localmente e preparare il changelog.

---
File creato automaticamente dal processo di pulizia; esegui i passaggi sopra per la verifica completa.
