Specifiche per i file di disegno meccanico compatibili con l'app "Forma Facile Parametro"
=========================================================================================

Questo documento descrive i formati supportati, i requisiti consigliati e la checklist per preparare disegni 3D che l'app possa analizzare correttamente.

Formati supportati
------------------
- STL (.stl) — mesh triangolare (ASCII o binary). Buono per anteprime e analisi approssimate.
- STEP (.step, .stp) — formato B‑Rep/parametrico. Preferibile per analisi precise e riconoscimento feature.
- IGES (.iges, .igs) — superfici/B‑Rep. Valido se contiene solidi chiusi.

Regole e best practice
----------------------
- Unità: preferibile millimetri (mm). Se il file usa unità diverse, convertire in mm prima dell'analisi.
- Solidi chiusi (watertight): per stimare volume e spessori con precisione il modello deve essere manifold.
- Singolo corpo: se possibile, esportare il singolo pezzo da analizzare; gli assembly possono complicare la stima di cavità e iniezione.
- Normali coerenti: per STL, assicurarsi che le normali dei triangoli siano orientate correttamente.
- Triangolazione: evitare mesh eccessivamente dense (> ~1M triangoli) per mantenere le prestazioni del browser.
- Formati B‑Rep (STEP/IGES): esportare come corpi solidi, non solo superfici aperte o NURBS non chiuse.
- Nomina file: usare nomi semplici senza caratteri speciali; mantenere l'estensione corretta.

Checklist rapida prima dell'upload
----------------------------------
- [ ] File ha estensione .stl, .step/.stp o .iges/.igs
- [ ] Unità in mm o indicata chiaramente
- [ ] Modello manifold (watertight)
- [ ] Normali corrette (per STL)
- [ ] Non più di ~1M triangoli per STL (se possibile ridurre)
- [ ] Se assembly: estrarre singolo corpo o indicare componente

Limitazioni e note pratiche
---------------------------
- STL non contiene informazioni topologiche: feature come filetti o fori non sono esplicitamente rappresentati.
- STEP/IGES permettono di estrarre volume e feature con maggiore affidabilità ma il parsing B‑Rep è più pesante (WASM).
- Browser environment: parsing complesso (STEP/IGES) usa WebAssembly e può essere più lento o consumare memoria.

Suggerimenti per la conversione
--------------------------------
1. Aprire il modello nel CAD e verificare le unità (impostare mm).
2. Verificare chiusura del solido; riparare buchi se necessari.
3. Per STL: esportare in binary STL e controllare le normali.
4. Per STEP: salvare come "solid body" ed evitare riferimenti ad assembly non necessari.

Esempi di file di test disponibili
---------------------------------
- `public/sample-drawings/cube40x40x10.stl`
- `public/sample-drawings/test-cube-10x10x10.stl`

Contatti e supporto
-------------------
Se vuoi, posso verificare uno dei tuoi file di test e generare i warning/consigli automaticamente.
