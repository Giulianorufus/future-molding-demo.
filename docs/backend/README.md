# Backend Node.js/Express

## Avvio

1. Installa le dipendenze:
   ```bash
   npm install express cors pg
   ```
2. Avvia il server:
   ```bash
   npx ts-node src/backend/server.ts
   ```

## API
- `GET /api/press` — Elenco presse
- `POST /api/press` — Crea pressa
- `GET /api/user` — Elenco utenti
- `POST /api/user` — Crea utente

## Database
Vedi `src/db/schema.sql` per la struttura PostgreSQL.
