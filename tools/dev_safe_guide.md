# Future Molding – SVCode SAFE MODE

## Comandi sempre validi
Usa sempre:
"Leggi svcode_rules.md prima di procedere."

## Regole
1. Non toccare file protetti.
2. Non modificare pipeline CAD.
3. Non modificare calcEngine.
4. Non reintrodurre file cancellati.
5. Lavora SOLO nei file che indico.

## Workflow sicuro
### Modifica un file
Leggi svcode_rules.md.
Lavora solo in:
src/percorso/fileDaModificare.tsx

### Aggiunta nuovo modulo
Leggi svcode_rules.md.
Crea un nuovo file in:
src/components/NomeComponente.tsx

### Fix sicuro
Modalità SAFE:
Modifica minima, nessun impatto su CAD/engine/stores.

### Reset modifica locale
git restore .
git reset --hard
