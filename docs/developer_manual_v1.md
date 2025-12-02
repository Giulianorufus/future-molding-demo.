# Future Molding — Developer Manual v1.0

## 1. Setup

- Node 18+
- `npm install`
- `npm run dev`

## 2. Caricamento CAD

Il file viene gestito così:

1. L’utente carica qualsiasi formato (STEP/IGES/STL/OBJ/GLB)
2. `startCadPipeline(file)`
3. parsing con OCCT (se disponibile)
4. fallback mesh se OCCT fallisce
5. risultati salvati in `cadStore`

Mostrare nel viewer: usare solo `ThreeViewer.tsx`.

## 3. Stato applicazione

Stato globale diviso in store:
- `cadStore` → CAD + analisi
- `modelStore` → compatibilità UI
- `parametriStore` → calcolo injection
- `pressStore` → selezione pressa
- `analysisStore` → analisi finale

## 4. Motore matematico

Per calcolare parametri:

```ts
import { calcolaParametri } from '@/engine/calcEngine'
```

Input:
- geometry
- macchina
- materiale

Output:
- ciclo
- pressioni
- velocità
- profili 3 step
- tonnellaggio
- note e suggerimenti

## 5. Difetti

Modificare risultati:

```ts
useParametriStore.getState().applyDefectFix(defectId)
```

Regole tecniche: `defectRules.ts`.

## 6. Componenti 3D

Viewer ufficiale:
- `src/components/ThreeViewer.tsx`

Non usare altri viewer.
Non reintrodurre i vecchi file.

## 7. Aggiunta nuovi materiali o presse

Modificare solo:
- `materialCatalog.ts`
- `arburgPressCatalog.ts`

## 8. Prima di integrare modifiche

Eseguire sempre:

```powershell
npx tsc --noEmit
npm test
npm run dev
```

---
Manuale generato automaticamente durante la fase di consolidamento (2025-12).