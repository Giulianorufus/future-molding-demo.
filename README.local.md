# Forma Facile — Sviluppo locale

Questo repository è stato configurato per sviluppo completamente locale e scollegato da servizi remoti.

Requisiti
- Node.js 18+ e npm

Quick start (PowerShell)
```powershell
npm ci
npm run dev
```

Eseguire i test
```powershell
npm test
# oppure eseguire singolo test
npx jest src/services/__tests__/calculationEngine.test.ts --runInBand
```

Comandi utili
- Verificare remotes (dovrebbe essere vuoto): `git remote -v`
- Ricreare git e collegare a un nuovo remote (opzionale):
```powershell
git init
git add .
git commit -m "Initial local commit"
git remote add origin <NEW_GIT_URL>
git push -u origin HEAD
```

Nota sulla privacy
- Il progetto ora è offline-only per quanto riguarda il controllo versione remoto. Se desideri ricollegarlo a GitHub o a un altro server Git, esegui i comandi di inizializzazione sopra.

Supporto e sviluppo
- Se vuoi che io aggiunga task aggiuntivi in `.vscode/tasks.json` o script per packaging/Electron, dimmi quale preferisci e lo aggiungo.

-- Guardrail: safe workflow --

1) New branch for each feature
	git checkout -b feat/materials

2) Snapshot before big replace
	git status
	git add -A
	git commit -m "chore(snapshot): before materials"

3) After each file change: run checks
	npm run check

4) Install Husky (one-time, locally):
	npm i -D husky
	npx husky install
	npx husky add .husky/pre-commit "npm run check"
	# optional: npx husky add .husky/pre-push "npm run check"

5) Emergency rollback
	# discard local changes
	git restore .
	git clean -fd
	# or save then restore
	git stash -u

Notes:
- Do not commit to `main`/`master` directly.
- Use file-replace for large patches; avoid mixing old and new content.
- After large TS fixes: in VS Code run "TypeScript: Restart TS Server".
