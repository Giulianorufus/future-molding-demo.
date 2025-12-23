# Gate Freeze Study — CSV → plateau → recommendation

Breve README/usage per lo script `tools/gate-freeze-study.mjs`.

Comandi base

```bash
npm i -D papaparse
npm run gate:freeze -- --in "data/*.csv" --out "out/gate-freeze" --debug
```

Formato CSV richiesto (header minimo consigliato)

```csv
recipeFingerprint,materialId,pressId,producedQty,scrapQty,defect,cycleTime_s,holdingTime_s,partWeight_g,notes
```

Note
- Lo script autodetecta il separatore (`,`/`;`/`\t`) e supporta glob `--in "dir/*.csv"`.
- Per il vero Gate Freeze servono *entrambi* i campi `holdingTime_s` e `partWeight_g`.
- Se `partWeight_g` manca lo script calcola comunque `scrap_rate` (da `scrapQty/producedQty`) e lo include negli `aggregates` e nel grafico.

Output generati
- `out/gate-freeze/summary.json` — sommario dettagliato
- `out/gate-freeze/summary.csv` — tabella riassuntiva
- `out/gate-freeze/aggregates/*.csv` — tabella per serie (hold, weight mean, sd, scrap_rate...)
- `out/gate-freeze/plots/*.html` — grafici interattivi (Plotly)

Esempio run

```bash
npm run gate:freeze -- --in "scripts/dev/fixtures_production.csv" --out "out/gate-freeze" --debug
```

Suggerimenti
- Se i CSV in ingresso hanno header non standard, considera di aggiungere la colonna `holdingTime_s` e `partWeight_g` nel processo di export.
- (Opzionale) Lo script supporta in-branch modifiche: è comodo aggiungere un piccolo `--hold-col` override se ricevi header sporchi.

Esempio output

Riga di `summary.csv` (esempio):

```
sample-gate-freeze.csv,materialId=PP|pressId=AR100,1.2,entro_0.20%_dal_max,10,true,out/gate-freeze/aggregates/sample-gate-freeze__materialId=PP_pressId=AR100.csv,out/gate-freeze/plots/sample-gate-freeze__materialId=PP_pressId=AR100.html
```

Prime 5 righe di un `aggregates/*.csv` (esempio):

```
hold_s,weight_mean_g,weight_sd_g,n_weight,cycle_mean_s,ok_rate,defects_mean,scrap_rate
0.4,12.055,0.005,2,18.25,,,0.039
0.6,12.185,0.005,2,18.45,,,0.0265
0.8,12.295,0.005,2,18.8,,,0.0145
1.0,12.335,0.005,2,19.0,,,0.0075
1.2,12.35,0,2,19.1,,,0.004
```
