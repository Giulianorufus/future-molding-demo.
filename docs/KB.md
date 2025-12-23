# KB Locale Casi — Operazioni e workflow

## Scopo
La KB locale (`data/kb/cases.json`) raccoglie i casi di produzione importati dall'operatore. Questo archivio locale è la sorgente per generare la `policy` unificata per `recipeFingerprint` (Gate Freeze + Packing). La KB è pensata per essere gestita dall'operatore e non deve contenere dati sensibili o essere committata nel repository.

## File coinvolti

- `data/kb/cases.json` — archive locale dei casi (ignorato da Git; mantiene array di oggetti caso).
- `public/policy/recommended_by_recipeFingerprint.json` — output generato dallo script di build policy (usato dall'app frontend).

## Workflow operativo (operatore)

1. Append dei casi da CSV (operatore locale):

```bash
node tools/kb/append-cases-from-csv.mjs <file.csv>
```

2. Genera la policy unificata dalla KB:

```bash
node tools/policy-build-from-kb.mjs
```

3. Verifica in UI: apri l'app, vai su **Parametri**; se esiste una raccomandazione per il `recipeFingerprint` del caso, la UI mostrerà la suggerimento (`Gate Freeze` e/o `Packing`).

## Colonne CSV supportate (alias principali)

Lo script di append implementa mapping semplice con alias comuni. Colonne supportate/riconosciute:

- `recipeFingerprint` (obbligatorio) — identificatore ricetta
- `holdingTime_s`, `hold_s`, `holding_time_s` — tempo di holding (s)
- `partWeight_g`, `part_weight_g`, `weight_g` — peso parte (g)
- `holdingPressure_bar`, `holding_pressure_bar`, `pressure_bar` — pressione di tenuta (bar)
- `materialId`, `material` — id materiale
- `pressId`, `press` — id pressa
- `producedQty`, `produced_qty`, `qty` — quantità prodotta
- `scrapQty`, `scrap_qty`, `scrap` — quantità scarto
- `defect`, `defectId` — codice difetto (opzionale)

Minimi consigliati per generare raccomandazioni utili:

- Per Gate Freeze: `recipeFingerprint`, `holdingTime_s`, `partWeight_g`
- Per Packing: aggiungere `holdingPressure_bar` insieme a `partWeight_g`

## Note di sicurezza

- Non committare `data/kb/cases.json` né i CSV di produzione nel repository.
- Mantieni i CSV di produzione su storage locale protetto e usa gli script operatori per popolare la KB.

## Troubleshooting rapido

- Pochi `points` (poche righe per fingerprint): la confidence sarà bassa — la UI non auto-applica raccomandazioni.
- `recipeFingerprint` mancante: la riga viene ignorata (non può essere associata a una fingerprint).
- Separatore CSV: lo script prova a rilevare `;` oppure `,`. Se il file è diverso, pre-processalo prima.

---

Per dettagli operativi aggiuntivi o per integrare la generazione policy nella pipeline di publish, vedere i tool in `tools/`.

## Publish policy

Per pubblicare la policy unificata (append KB → build → scrivi output):

- Comando standard:

	```bash
	npm run policy:publish -- --in "data/production/*.csv"
	```

- Override (per test/debug, usa percorsi isolati):

	```bash
	npm run policy:publish -- --in "..." --kb "path/cases.json" --out "path/recommended_by_recipeFingerprint.json"
	```

- Nota: `--kb` e `--out` sono utili per isolare ambienti e non toccare i dati locali.

Lo script logga il numero di casi aggiunti, il numero di fingerprint nella policy e il path dell'output.
