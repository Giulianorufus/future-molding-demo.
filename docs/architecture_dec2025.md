# Architettura tecnica Future Molding — Versione consolidata dicembre 2025

## A. Panoramica generale

Future Molding è composto da:

- Pipeline CAD unificata
- Motore matematico di stampaggio
- Sistema difetti + AI rules
- UI modulare
- Stores Zustand tipizzati
- Cataloghi pressa/materiali professionali

Il sistema è progettato per funzionare senza server esterni, con possibilità di espansione.

## B. Struttura macro

```
src/
 ├─ cad/           → parsing CAD, pipeline 3D
 ├─ engine/        → motore matematico + safety
 ├─ data/          → cataloghi ufficiali
 ├─ store/         → Zustand stores
 ├─ components/    → UI React industriale
 ├─ pages/         → pagine principali
 ├─ lib/           → analisi CAD / parser OCCT
 └─ utils/         → helpers accessori
```

## C. Pipeline CAD (ufficiale, unificata)

Flusso:

- Upload
- `startCadPipeline(file)`
- sanitize nome → objectURL
- `analyzeCADFile` (calcola volume, area, thickness, bbox)
- Salvataggio in `cadStore`
- Propagazione verso `modelStore` per compatibilità UI
- Viewer 3D → `ThreeViewer.tsx`

Formato richiesto in tutta l’app: `CadAnalysisResult`.

## D. Motore Matematico

File ufficiali:
- `calcEngine.ts`
- `calcHelpers.ts`
- `calcTypes.ts`
- `safetyChecks.ts`

Funzioni fondamentali:
- Calcolo VP
- Profili 3-step (iniezione / pack / holding)
- Temperature
- Velocità in cm³/s
- Pressioni
- Tonellaggio (chiusura stampo)
- Ciclo
- Contropressione

Output ufficiale: `CalcOutput`.

## E. Cataloghi Presse e Materiali

Unici file validi:
- `arburgPressCatalog.ts`
- `materialCatalog.ts`

Ogni voce contiene:
- id
- nome commerciale
- parametri tecnici
- limiti operativi
- viscosità / temperature (materiali)

Nessun altro file deve gestire presse o materiali.

## F. Gestione Difetti

Sistema deterministico basato su `defectRules.ts`.
Flusso:
- selezione difetto
- `setDefect`
- `applyDefectFix`
- parametri corretti e spiegazione tecnica

## G. UI

- Viewer 3D unico: `ThreeViewer.tsx`.
- Pages critiche: `ParametriPage.tsx`, `Difetti.tsx`.

Entrambe leggono `cadStore` e `parametriStore`.
