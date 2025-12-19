# Forma Facile — Sviluppo locale
Requisiti
- Node.js 18+ e npm

Quick start (PowerShell)
```powershell
npm ci
npm run dev
 - Run the safe checks before committing. 
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
