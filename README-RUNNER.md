# Runner STEP → GLB

File: `scripts/test-step-load.mjs`

Breve guida d'uso

- Requisiti:
  - Node.js 18+ (consigliato)
  - Dipendenze del progetto installate (`npm ci`)

- Uso:
# RUNNER STEP → GLB → UI (Future Molding)

Questo documento spiega come usare i due runner locali:

- `scripts/test-step-load.mjs`
- `scripts/e2e-simulate-upload.mjs`

Entrambi servono a testare l’intero flusso CAD → GLB → UI.

---

## 1. Convertire STEP/IGES in GLB

Comando:

```bash
node scripts/test-step-load.mjs "C:\path\al\tuo\file.stp"
```


Output generato:

Mesh triangolata (OCCT se disponibile)

File GLB generato in /tmp/<nomefile>.glb

Log dettagliato in console

Se OCCT non è disponibile → fallback a viewerUrl AI.


2. Simulare l’upload in browser (E2E)

Prerequisiti:

Server Vite attivo:

```bash
npm run dev
```


Comando:

```bash
npm run e2e:simulate
```


Cosa fa:

Apre Chromium headless

Carica la pagina #/parametri

Effettua l’upload del GLB

Attende l’analisi

Seleziona pressa + materiale

Attende i risultati

Stampa i parametri calcolati

3. File GLB generati

I GLB vengono scritti in:

/tmp/


Aggiungi questa cartella al .gitignore se non vuoi committarla.

4. Troubleshooting
OCCT non parte

Il runner usa import dinamici

Se OCCT manca, viene usato fallback

Chromium non parte

Installa:

```bash
npx playwright install chromium
```

Parametri strani

Controlla:

volume/area dal loader

pressa selezionata

materiale selezionato

analysis nel modelStore

5. Note finali

Questo runner permette di testare l’intero flusso
anche senza aprire l'app manualmente.

Perfetto per sviluppo rapito, debug CAD e QA industriale.


---

# ✅ 3. **Preparazione commit locale**

Esegui:

```bash
git add .
git commit -m "chore: add e2e simulate script, create README-RUNNER.md and finalize CAD→UI test pipeline"
```


NOTA:
Non ho fatto push perché non hai fornito il remote.
