# Future Molding

Applicazione locale per impostare un ciclo di stampaggio a iniezione a partire dal CAD di un singolo pezzo.

## Requisiti

- Node.js 20+
- npm

## Avvio

```powershell
npm ci
npm run dev:safe
```

L'applicazione e' disponibile su `http://127.0.0.1:3000`.

## Flusso operatore

1. Apri il Wizard e carica un disegno STEP/IGES, GLB o STL.
2. Configura stampo: cavita', sistema di alimentazione e, per canale freddo, canali/materozza.
3. Seleziona pressa, modello e diametro vite.
4. Seleziona il materiale e calcola i parametri.
5. Nella schermata Parametri puoi consultare la sintesi, selezionare gate nella simulazione qualitativa e usare **Esporta ricetta** per generare JSON, CSV e PDF.

Il CAD descrive un pezzo singolo: cavita' e canali sono configurazione dello stampo. La simulazione e' qualitativa e non sostituisce un solver Moldflow validato.

## Verifiche

```powershell
npm run check
npm run typecheck
npm run build
npm run test:cad:strict
npm run test:e2e
```

L'E2E del Wizard usa `public/sample-drawings/Frutto (1).stp` e verifica caricamento STEP, metriche CAD, scelta stampo/pressa/materiale e calcolo parametri.

## CAD tests (OCCT integration)

The CAD pipeline uses `occt-import-js` via WASM. There are two modes:

### Standard unit tests
Runs without OCCT integration.

```bash
npm test
```

CAD integration tests (gated)

Enable CAD integration tests by setting RUN_CAD_INTEGRATION=1.

```bash
npm run test:cad
```

CAD integration strict (CI / regression)

Strict mode fails if OCCT parsing returns the fail-soft marker features: ["occt-unavailable"].

```bash
npm run test:cad:strict
```

Fixture

The strict integration test requires a valid STEP fixture:

src/lib/tests/fixtures/cad/box_20mm.step

If the fixture is missing or invalid, `test:cad:strict` will fail.

Notes

The OCCT build used in this project exposes readers like ReadStepFile / ReadIgesFile.

STL reader is not guaranteed (many builds do not expose ReadStlFile), therefore the integration test uses STEP only.

## Export ricetta (JSON / CSV / PDF)

Dalla pagina **Parametri** è disponibile il bottone **Esporta ricetta** dopo il calcolo.

Genera tre file con lo snapshot corrente di CAD, stampo, pressa, materiale e calcolo:

- `recipe.json` — snapshot completo del calcolo (meta, input, output, warnings/assumptions).
- `recipe.csv` — estratto con colonne principali (separatore `;`).
- `recipe.pdf` — versione stampabile sintetica.

Comandi utili:

```bash
npm test
npm run smoke:pdf      # esegue lo smoke rapido (usa tsx loader)
npm run samples:recipe # genera samples/recipe.sample.*
npm run gate:freeze:publish # rigenera e pubblica public/gate-freeze/recommended_by_recipeFingerprint.json (vedi gate-freeze-study.md)
npm run policy:publish # append KB -> build -> pubblica public/policy/recommended_by_recipeFingerprint.json (v. docs/KB.md)
```

## Gate Freeze policy

- La policy Gate Freeze genera raccomandazioni di holding time per `recipeFingerprint` (plateau peso vs holding) e le pubblica in `public/gate-freeze/recommended_by_recipeFingerprint.json`.
- In UI (Parametri) la raccomandazione può essere applicata con guardrail (confidence/points/limiti) ed è sempre reversibile.
- I CSV di produzione usati per generare la policy **non devono essere committati** nel repo (contengono dati di processo).
- Mantieni i dati reali in percorsi locali (es. `data/production/`) e pubblica solo il JSON “policy” risultante.
- Se una raccomandazione non esiste per un fingerprint, la UI non applica nulla.

I sample generati sono in `samples/`. File temporanei di debug vengono scritti in `tmp/` (ignorata da git).

## Knowledge Base (KB)

Vedi la documentazione operativa: [docs/KB.md](docs/KB.md) — contiene il workflow per popolare la KB locale (`data/kb/cases.json`) e generare la `public/policy/recommended_by_recipeFingerprint.json`.

- Dettagli e workflow KB: vedi `docs/KB.md` (sezione Publish policy)
