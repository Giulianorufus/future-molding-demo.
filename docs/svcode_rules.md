# Regole vincolanti per modifiche al progetto Future Molding

IMPORTANTE — Non violare nessuna di queste regole.

A. File e cartelle che NON devono essere modificati, riscritti o rigenerati

SVCode deve considerare questi file intoccabili salvo esplicita richiesta dell’utente:

- `src/cad/cadStore.ts`
- `src/cad/cadPipeline.ts`
- `src/lib/cadAnalysis.ts`
- `src/lib/cadParser.ts`
- `src/engine/calcEngine.ts`
- `src/engine/calcHelpers.ts`
- `src/engine/calcTypes.ts`
- `src/engine/safetyChecks.ts`
- `src/data/arburgPressCatalog.ts`
- `src/data/materialCatalog.ts`
- `src/store/parametriStore.ts`
- `src/store/modelStore.ts`
- `src/components/ThreeViewer.tsx`

B. File e moduli che NON devono essere ricreati o reintrodotti

Questi file sono stati eliminati intenzionalmente. NON devono più comparire nel progetto:

- Difetti3D.tsx
- Difetti3D.js
- DifettiAnnotator3D.tsx
- AIDefectsAssistant.tsx
- DefectsAssistant.tsx
- DefectPicker.tsx
- DefectPicker.js
- ModelViewer (vecchio)
- StepViewer (vecchio)
- glbLoader.ts
- stlLoader.ts
- stepLoaderClean.ts
- pressData.ts (vecchio)
- materials.json
- materials.ts (vecchio)
- materialLibrary.js
- calculationEngine.js
- calcEngine.js (vecchio)
- drawingStore.js
- analysisStore.js

C. File e moduli che SVCode DEVE usare sempre

- `ThreeViewer.tsx` → unico viewer 3D ufficiale
- `cadStore.ts` → unico store per gestione CAD
- `cadPipeline.ts` → unica pipeline di analisi CAD
- `calcEngine.ts` → unico motore matematico
- `calcHelpers.ts` → helper ufficiali
- `calcTypes.ts` → tipi ufficiali del calcolo
- `safetyChecks.ts` → controlli di sicurezza
- `arburgPressCatalog.ts` → catalogo presse ufficiale
- `materialCatalog.ts` → catalogo materiali ufficiale
- `parametriStore.ts` → store ufficiale dei parametri

D. Regole sul flusso di lavoro

SVCode deve mantenere e rispettare questo flusso, senza modificarlo:

1. L’utente carica un disegno → `startCadPipeline`
2. `cadPipeline` invoca `analyzeCADFile`
3. Risultati salvati in `cadStore`
4. `parametriStore` legge i dati dal `cadStore`
5. Utente seleziona pressa e materiale
6. `calcolaParametri` produce output
7. Difetti → `applyDefectFix`

Nessun passo può essere cambiato senza richiesta esplicita.
