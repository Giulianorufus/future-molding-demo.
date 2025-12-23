# Gate Freeze — Procedura operativa

Breve guida operativa per rigenerare e pubblicare la policy recommended_by_recipeFingerprint.json prodotta dallo studio Gate Freeze.

Prerequisiti
- File CSV di produzione (locale) che contengano almeno le colonne minime: `recipeFingerprint`, `holdingTime_s`, `partWeight_g` (altri campi utili: `materialId`, `pressId`, `shotVolume_cm3`).

Comando
- Rigenera e pubblica l'artefatto sul repository web-served:

  - `npm run gate:freeze:publish`

- Override dell'input (es. path locale o wildcard):

  - `npm run gate:freeze:publish -- --in "path/*.csv"`

Output aggiornato
- Il comando aggiornerà il file servito dall'applicazione web:

- `public/gate-freeze/recommended_by_recipeFingerprint.json`

Verifica rapida
- Apri l'app e vai su Parametri per un pezzo che ha `recipeFingerprint` presente nel JSON pubblicato.
- Dovrebbe comparire lo stato della raccomandazione: “Suggerito” o “Applicato” (se la policy è stata applicata automaticamente dal frontend secondo le guardrail).

Nota sicurezza
- NON committare CSV di produzione nel repository.
- I CSV in `data/production/` devono restare locali e gestiti dall'operatore.
- Questo script è pensato per essere eseguito manualmente dall'operatore; non inserirlo in CI che esegue con dati sensibili.

Esempio commit (esegui nella root del repo):

```bash
git add gate-freeze-study.md README.md
git commit -m "docs(gate-freeze): operational publish procedure"
git push origin maestro
```

---

Se vuoi, posso aggiungere un breve riferimento anche nel README.md principale o creare una piccola checklist operativa in docs/.
