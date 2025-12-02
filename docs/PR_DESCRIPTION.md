# PR: Consolidamento Pipeline CAD, Pulizia 3D Legacy e Unificazione Motore Parametri (Dicembre 2025)

Questa PR consolida definitivamente l’architettura tecnica di Future Molding e introduce un flusso unico, coerente e stabile per:

- upload CAD
- analisi geometrica (OCCT + fallback)
- viewer 3D
- motore matematico
- gestione difetti
- calcolo parametri

È la PR più importante del progetto fino ad oggi, perché elimina definitivamente file conflittuali e garantisce che SVCode e qualsiasi altra IA NON possano più alterare la struttura critica del software.

## 🚀 Obiettivi principali della PR

- Unificare la pipeline CAD
- Eliminare completamente i viewer 3D legacy
- Eliminare i motori di calcolo duplicati
- Centralizzare cataloghi presse/materiali
- Garantire un flusso unico da file → analisi → calcolo → difetti
- Imporre regole tecniche vincolanti per AI/Collab tools

## 🧠 Flusso tecnico ufficiale (vincolante)

NON modificabile salvo richiesta dell’utente.

- Upload file 3D → `startCadPipeline(file)`
- `cadPipeline` invoca `analyzeCADFile`
- Risultati salvati in `cadStore` (volume, area, thickness, bbox)
- Propagazione compatibile verso `modelStore`
- Scelta pressa Arburg e vite → lettura da `arburgPressCatalog`
- Scelta materiale → lettura da `materialCatalog`
- `calcolaParametri` produce i parametri completi
- Difetti → `applyDefectFix` modifica il risultato in tempo reale

## 📦 Moduli UFFICIALI (non modificabili)

Questi moduli SONO LA BASE del progetto.

### CAD
- `src/cad/cadStore.ts`
- `src/cad/cadPipeline.ts`
- `src/lib/cadAnalysis.ts`
- `src/lib/cadParser.ts`

### Motore calcolo
- `src/engine/calcEngine.ts`
- `src/engine/calcHelpers.ts`
- `src/engine/calcTypes.ts`
- `src/engine/safetyChecks.ts`

### Dati ufficiali
- `src/data/arburgPressCatalog.ts`
- `src/data/materialCatalog.ts`

### Store
- `src/store/parametriStore.ts`
- `src/store/modelStore.ts`

### Viewer unico
- `src/components/ThreeViewer.tsx`

SVCode deve sempre usare questi file.
Nessun altro file deve duplicarne la logica.

## 🧹 File eliminati (NON reintrodurre)

Questi file sono stati cancellati perché incompatibili con la nuova architettura.
NON POSSONO essere ricreati o ripristinati in alcuna forma:

### ❌ 3D Viewer legacy
- Difetti3D.tsx
- Difetti3D.js
- DifettiAnnotator3D.tsx
- ModelViewer.tsx (vecchio)
- StepViewer.tsx (vecchio)
- Viewer3D.tsx (vecchio)

### ❌ Loader 3D vecchi
- glbLoader.ts
- stlLoader.ts
- stepLoaderClean.ts

### ❌ Calcolo parametri obsoleto
- calculationEngine.js
- calcEngine.js (vecchio)
- processEnhancers.js
- enhancedCalcEngine.js

### ❌ Cataloghi duplicati
- pressData.ts (vecchio)
- materials.json
- materials.ts (vecchio)
- materialLibrary.js
- pressMapping.js

### ❌ Store duplicati
- analysisStore.js
- defectsStore.js
- drawingStore.js
- appStore.js

## 📁 File aggiunti
- `docs/svcode_rules.md`
- `docs/architecture_dec2025.md`
- `docs/CHANGELOG-2025-12.md`
- `docs/developer_manual_v1.md`
- `docs/manual_verification.md`
- `src/store/cadStore.ts`
- `src/cad/cadPipeline.ts`
- `src/utils/sanitizeFileName.ts`

## 🔍 Test eseguiti
- TypeScript OK (`npx tsc --noEmit`)
- Jest OK (29 test, 12 suite → tutte passate, 1 skipped)
- E2E upload → analisi → calcolo → difetti funzionante

## 📝 Checklist PR
- [ ] Eliminati tutti i viewer 3D obsoleti
- [ ] Unificato flusso CAD
- [ ] Consolidati cataloghi pressa/materiale
- [ ] Eliminati motori duplicati
- [ ] Aggiornate tutte le importazioni
- [ ] Nessun errore TypeScript
- [ ] Tutti i test verdi
- [ ] Documentazione aggiornata
- [ ] Nessun regressione sulla UI Parametri
- [ ] Nessuna regressione sulla UI Difetti

## 🔒 Note per strumenti AI (SVCode / ChatGPT / ecc.)

Qualsiasi modifica a:

- `calcEngine.ts`
- `cadStore.ts`
- `cadPipeline.ts`
- `arburgPressCatalog.ts`
- `materialCatalog.ts`
- `parametriStore.ts`
- `ThreeViewer.tsx`

DEVE essere autorizzata dall'utente.
Nessuna AI può rigenerare file eliminati.
Nessuna AI può modificare il flusso architetturale definito sopra.

## 🔚 Conclusione

Questa PR “chiude il cerchio” strutturale del progetto Future Molding:

- flusso unico
- nessun file duplicato
- calcolo coerente
- pipeline CAD professionale
- viewer unificato
- difetti integrati

Base sicura per le prossime funzionalità (AI, simulation, presets macchina)
