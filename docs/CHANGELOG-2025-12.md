# ChangeLog tecnico — Future Molding (dicembre 2025)

## Consolidation 2025.12 — CAD + Engine cleanup

### Rimosso
- 3D viewer vecchi: `Difetti3D`, `ModelViewer`, `StepViewer`
- Vecchi loader: `glbLoader`, `stlLoader`, `stepLoaderClean`
- Motori duplicati: `calculationEngine.js`, `calcEngine.js`
- Cataloghi duplicati: `pressData.ts`, `materials.json`, `materialLibrary.js`
- Vecchi store `.js`: `drawingStore.js`, `analysisStore.js`, etc.

### Aggiunto
- `cadStore.ts` (unico store CAD)
- `cadPipeline.ts` (pipeline CAD unificata)
- `sanitizeFileName.ts`
- `docs/manual_verification.md`

### Modificato
- `ParametriPage.tsx` → ora usa pipeline CAD
- `Difetti.tsx` → ora usa `cadStore` & `ThreeViewer`
- `materials.ts` → adattato al catalogo unificato
- `pressData.ts` → neutralizzato
- `calcEngine.ts` → pulizia e import corretti

### Test
- 29 test totali, 12 suite
- 1 test skipped (occt)
- TypeScript: pass

---
Documento generato automaticamente durante la fase di consolidamento (2025-12).