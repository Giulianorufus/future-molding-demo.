# Forma Facile — Parametro (locale)

Progetto per calcolo parametri di stampaggio e preview CAD, preparato per uso e sviluppo locale.

Requisiti
- Node.js 18+ e npm

Quick start
```powershell
git checkout feature/parametri-anteprima
npm ci
npm run dev
```

Eseguire i test
```powershell
npm test
# oppure eseguire singolo test
npx jest src/services/__tests__/calculationEngine.test.ts --runInBand
```

Uso offline
- Il progetto è pensato per essere eseguito localmente; non dipende da servizi esterni per funzionare in modalità base.
- Cartelle come `public/lovable-uploads` erano usate per demo remota e possono essere svuotate o rimosse.

Supporto
- Se vuoi che il progetto sia completamente privo di tracking remoto, rimuovi il remote Git (es.: `git remote remove origin`) o rimuovi la cartella `.git` per scollegare la cronologia.

Note
- Tutti i riferimenti a servizi di terze parti per demo sono stati rimossi dalla documentazione e dai commenti nel codice. Il codice rimane compatibile con flussi locali e può essere adattato per integrazioni future.

Licenza
- Vedi `LICENSE` o aggiungi una se desideri un rilascio ufficiale.

---

# FUTURE MOLDING — FLUSSO UFFICIALE

1. Carica file 3D (STL, STEP, IGES, OBJ, GLB)
2. CAD Loader → converte → mesh unificata
3. CAD Analyzer → estrae:
	- volume pezzo
	- volume materozza
	- area proiettata
	- spessore medio
4. store.parametri.setGeometry(...)
5. Operatore seleziona:
	- pressa
	- modello pressa
	- materiale
6. Premi "Calcola parametri"
7. calcEngine → produce parametri reali
8. UI mostra pagina:
	CalculatedParameters
9. Se difetto → pagina Difetti
10. DefectAI → ricalcolo automatico
11. Fine.

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
