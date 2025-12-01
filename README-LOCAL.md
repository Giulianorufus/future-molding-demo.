Forma Facile - Copia Locale

Questo repository e' una copia locale pensata per lo sviluppo offline.
La cronologia Git e' stata rimossa intenzionalmente; puoi inizializzare un nuovo repository locale se lo desideri.

Comandi rapidi (PowerShell)

Installare dipendenze:
PowerShell:
npm ci

Eseguire in modalita' sviluppo (Vite):
PowerShell:
npm run dev

Eseguire test unitari (Jest):
PowerShell:
npm test

Eseguire test E2E (Playwright) - avviare prima il dev server in un terminale:
Terminale A:
npm run dev

Terminale B:
npx playwright test

Creare una nuova history Git locale (opzionale):
PowerShell:
git init
git add .
git commit -m "Initial local commit"

Note:
- La cartella .git e' stata rimossa; non esistono remoti configurati.
- Il file ZIP di export (senza node_modules) si trova in C:\Users\Utente\Documents\forma-facile-parametro-export.zip.

Se vuoi che ricrei lo ZIP includendo un README diverso o includendo node_modules, dimmi come preferisci.
