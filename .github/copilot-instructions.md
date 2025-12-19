# Copilot instructions — Future Molding

## Vincoli prodotto (non negoziabili)
- UX operatore: **Carica disegno → Seleziona pressa/modello/vite → Seleziona materiale → Calcola**.
- **Niente calibrazione manuale**: selezione difetto ⇒ ricalcolo automatico (silenzioso).

## File core (non sotto `lib/`: usa questi come “source of truth”)
- `calcEngine.ts` — motore principale regole di calcolo.
- `cadParser.ts` — parser CAD usato da util/worker e store.
- `cadAnalysis.ts` — analisi/metadata CAD usata da stores/utils.
- Utilities CAD/mesh: `cadMetaFromMesh.ts`, `cadMetaEstimate.ts`.

## Cataloghi dati (non hardcodare nei componenti)
- Materiali: `materialCatalog.ts` + `materials.json` (funzione chiave: `getMaterialInput()`).
- Presse: `pressCatalog*` + `pressData.ts` (limiti pressa/vite e dati macchina).

## Stato globale
- Esistono **sia `src/store/` sia `src/stores/`** (es. `parametriStore.ts` può esistere in entrambi).
- Quando modifichi state o wiring UI→calcolo, cerca in entrambi i percorsi.

## Comandi (usa gli script reali del repo)
## Comandi (usa gli script reali del repo)
 Dev: `npm run dev` | `npm run dev:safe` (127.0.0.1:3000) | `npm run dev:5274`
 Preview: `npm run preview` | `npm run preview:safe` (127.0.0.1:8080) | `npm run preview:5274`
 Build: `npm run build` | firma: `npm run build:sign`
 Typecheck / check: `npm run typecheck` | `npm run check`
 Test: `npm test` | CI: `npm run test:ci` | full: `npm run test:all`
 CAD integration: `npm run test:cad` | strict: `npm run test:cad:strict`
 E2E: `npm run test:e2e` | (con dev auto): `npm run e2e` | simulate: `npm run e2e:simulate`
 OCCT runtime (critico): `npm run copy-occt` (eseguito anche in `postinstall`)
 Altri utili (secondari): `npm run generate:pdf` | `npm run electron:dev` | `npm run electron:build`
- `postinstall` esegue `copy-occt`: **non rimuovere/ignorare**.
Se c’è ancora qualcosa di “storto”, incollami l’elenco reale di scripts da package.json e ti faccio un’ultima passata per allineare i nomi al 100% (senza supposizioni).
## Logging & env
- `.env` influenza build/test (dotenv viene caricato).
- Nei test è normale vedere `console.debug`; non “ripulire” i log senza motivo.

## Convenzioni calcolo/difetti
- `warnings`, `assumptions`, `appliedCorrections`: mantenere **dedupe + ordine stabile** (risultati deterministici).
- Correzioni difetti: **idempotenti** (stesso difetto applicato due volte non accumula effetti).

## Workflow secondari (diventano primari solo se lavori su packaging/CI)
- `npm run generate:pdf`
- `npm run electron:dev` / `npm run electron:build`


Se c’è ancora qualcosa di “storto”, incollami l’elenco reale di scripts da package.json e ti faccio un’ultima passata per allineare i nomi al 100% (senza supposizioni).
**Panoramica**
- **Scopo repo**: applicazione TypeScript che contiene un motore di calcolo, servizi, loader CAD e un frontend React/Vite (con integrazione OCCT/Three). Codice principale sotto `src/`.
- **Componenti principali**: `src/lib` (funzioni di calcolo), `src/engine` (regole e orchestrazione del calcolo), `src/services` (adapters/orchestratori), `src/backend` (API/mock backend), `src/cad` (loader e parser CAD). Frontend: `index.html` + `vite.config.ts`.

**Comandi essenziali**
- Sviluppo: `npm run dev` (oppure task `Dev: Vite` / `Vite dev (safe)` in VSCode) — avvia Vite con hot-reload.
- Test: `npm test` — esegue Jest (ts-jest). I test d'integrazione con OCCT possono essere più lenti.
- Build produzione: `npm run build` — produce `dist/` con Vite.
- Preview build: `npm run preview` o task `Vite preview (safe)` — serve la build.

**Convenzioni del progetto**
- TypeScript e struttura: tutto in `src/`, file di test insieme al codice (`__tests__` o `__tests__`-style). Vedere `src/lib/calc/__tests__` per esempi.
- Logging: usare `src/core/log.ts` per log di input/output calcolo — molti test si aspettano output di `console.debug/console.log`.
- Environment: il progetto usa `.env` (dotenv) in runtime/test; i test mostrano avvisi di `dotenv` durante l'esecuzione.
- Pattern: funzioni pure e moduli di calcolo in `src/lib`, livelli di orchestrazione in `src/engine` e servizi in `src/services`.

**Integrazioni e punti critici**
- OCCT / WebAssembly: importato tramite `occt-import-js` — attenzione ai moduli Node (`path`, `crypto`) che Vite può externalizzare per compatibilità browser; controllare `vite.config.ts` se servono shim.
- Three/loader files: `src/cad` e il frontend usano Three.js loaders; vedi `project-full-preview/` e `dist/` per build artefatti.
- Electron: ci sono file `electron/main.js` e `electron/preload.js` — modifiche al runtime electron richiedono attenzione alla serializzazione e ai contesti di preload.

**Esempi pratici (search/patch patterns)**
- Aggiungere una nuova funzione di calcolo: modifica `src/lib/*`, aggiungi test in `src/lib/*/__tests__`, esegui `npm test`.
- Debug di un test che stampa input/output: cercare `logInput`/`logOutput` in `src/core/log.ts`.
- Se la build Vite fallisce per moduli Node importati da `occt-import-js`, controllare i messaggi di Vite e aggiungere alias/define in `vite.config.ts`.

**File chiave da consultare**
- `package.json` (script utili: `dev`, `build`, `test`, `preview`)
- `vite.config.ts` (config build, alias, e workaround browser)
- `tsconfig.*` (target/paths per ts-jest)
- `src/core/log.ts` (pattern di logging usato nei test)
- `src/lib`, `src/engine`, `src/services`, `src/cad` (sorgenti principali)

Se vuoi, procedo a fondere queste istruzioni con eventuali documenti esistenti o ad espandere sezioni specifiche (build, test, debugging OCCT). Fammi sapere quale parte vuoi approfondire.
