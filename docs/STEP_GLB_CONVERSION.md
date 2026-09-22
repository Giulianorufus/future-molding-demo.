# Verifica: Conversione STEP → GLB correttamente implementata

## Problema Identificato
In precedenza, `viewerUrl` veniva assegnato all'object URL del file STEP originale **senza attendere la conversione a GLB**. Poiché GLTFLoader non può processare file STEP, il viewer 3D non riusciva a visualizzare il modello.

## Soluzione Implementata

### 1. Drawing Store Esteso
**File**: `src/stores/drawingStore.ts`

Aggiunti due campi di tracciamento:
- `conversionStatus?: 'idle' | 'converting' | 'ready' | 'error'` - Stato della conversione STEP→GLB
- `conversionMessage?: string` - Messaggio da mostrare all'utente durante la conversione

### 2. CAD Pipeline Aggiornata
**File**: `src/cad/cadPipeline.ts`

**Logica per file STEP/IGES**:
- ✅ Rileva estensione file (`.step`, `.stp`, `.iges`, `.igs`)
- ✅ **NON assegna** `viewerUrl = URL.createObjectURL(file)` subito
- ✅ Invece, assegna stato di conversione:
  ```typescript
  conversionStatus: 'converting'
  conversionMessage: 'Modello STEP caricato. Conversione GLB non ancora disponibile.'
  ```
- ✅ Invoca `loadStepWithOcctAndAnalyze(file)` in **background** (senza await)
- ✅ Permette all'UI di rimanere reattiva durante la conversione

**Logica per file GLB/STL**:
- ✅ Usa il path standard `analyzeCADFile()`
- ✅ Assegna `viewerUrl` immediatamente
- ✅ Imposta `conversionStatus: 'ready'`

### 3. STEP Loader Aggiornato
**File**: `src/cad/loaders/stepLoader.ts`

Durante la conversione asincrona:
- ✅ Inizio: `conversionStatus: 'converting'`
- ✅ Successo: `conversionStatus: 'ready'` + `viewerUrl = GLB URL` (oggetto blob GLB)
- ✅ Errore: `conversionStatus: 'error'` + messaggio esplicito

### 4. UI Componente Difetti
**File**: `src/pages/Difetti.tsx`

Logica di rendering:
```tsx
{viewerUrl ? (
  <ThreeViewer viewerUrl={viewerUrl} />
) : conversionStatus === 'converting' ? (
  <div className="placeholder">
    ⏳ Conversione in corso...
    Modello STEP caricato. Conversione GLB non ancora disponibile.
  </div>
) : conversionStatus === 'error' ? (
  <div className="error">
    ❌ Errore durante la conversione del modello.
  </div>
) : (
  <div>Carica un disegno...</div>
)}
```

## Invarianti Applicate

| Scenario | viewerUrl | conversionStatus | Azione |
|----------|-----------|------------------|--------|
| File STEP caricato | `null` | `'converting'` | Mostra placeholder con messaggio |
| GLB generato (browser) | `blob:...` (GLB URL) | `'ready'` | Mostra viewer 3D |
| Conversione fallita | `null` | `'error'` | Mostra messaggio di errore |
| File GLB caricato | `blob:...` (file) | `'ready'` | Mostra viewer 3D immediatamente |

## Test di Regressione

**File**: `src/cad/__tests__/cadPipeline.conversionFlow.test.ts`

5 test confermano il flusso corretto:
- ✅ STEP file rilascia `viewerUrl` null e `conversionStatus: 'converting'`
- ✅ NON assegna object URL dello STEP a `viewerUrl`
- ✅ GLB file NON rimane in stato 'converting'
- ✅ Rileva `.step` e `.stp` come STEP
- ✅ Rileva `.iges` e `.igs` come IGES

## Garantie di Sicurezza

1. **GLTFLoader mai riceve STEP URL**: `viewerUrl` rimane `null` durante la conversione
2. **UI non si blocca**: `conversionStatus: 'converting'` senza `isLoading: true`
3. **Conversione asincrona**: Non awaita in `startCadPipeline()`, permette progresso UI
4. **Fallback sicuro**: Se conversione fallisce, mostra placeholder esplicito, non errore vago
5. **Estensioni riconosciute**: File `.step`, `.stp`, `.iges`, `.igs` seguono il path di conversione

## Prossimi Passi

Quando un utente:
1. **Carica STEP** → vede placeholder di conversione
2. **Attende** → browser esegue conversion in background via OCCT
3. **GLB generato** → store aggiornato con `viewerUrl` del GLB
4. **Placeholder scompare** → viewer 3D mostra il modello
