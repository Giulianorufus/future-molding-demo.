# Algoritmi chiave (Future Molding)

## Punto di commutazione (switch point)
**Riferimento:** volume iniettato dall'inizio della stampata, in cm³. Il CAD descrive un solo pezzo; lo stampo definisce cavità e canali.

`V_pezzi = V_pezzo × numero_cavità`

`V_dose = V_pezzi + V_canali_freddi`

`V_switch = V_canali_freddi + V_pezzi × percentuale_riempimento_pezzo / 100`

Con canale caldo il volume dei canali nella dose per ciclo è zero. La percentuale iniziale viene dal profilo qualitativo già presente nel motore; il valore in cm³ e la percentuale della dose totale condividono lo stesso riferimento. Ogni fase di iniezione termina entro il punto V/P.

Se volume del pezzo, numero di cavità confermato o volume dei canali freddi mancano, V/P resta non disponibile con un avviso. Il tempo V/P è una stima ottenuta sommando `volume_fase / portata_fase`. Per convertire il punto in posizione vite e cuscino macchina servono un riferimento di corsa e dati macchina che qui non sono dedotti dal CAD. La commutazione va verificata sullo stampo reale.

## Raffreddamento (nota di principio)
Definisci la correlazione tempo di raffreddamento con spessore e k del materiale. Documenta le costanti che usi.
