# Specifica algoritmo — Future Molding (Calcolo Parametri Reali)

## Scopo
Calcolare parametri di processo raccomandati per lo stampaggio a iniezione a partire da input operatore e dati pezzo (area proiettata, volume, materiale, pressa, diametro vite).

## Input richiesti
- `projArea_cm2` (A) — area proiettata in cm²
- `volume_cm3` (V) — volume in cm³ (opzionale, calcolabile da CAD)
- `material` — oggetto con proprietà `meltMin/meltMax`, `moldMin/moldMax`, `viscosity`, `density_g_cm3`, `family`
- `press` — oggetto pressa con `clampForceTon`, `screwDiameters[]`, eventuali limiti rpm/pressure
- `screwDiameter_mm` (D)
- `safetyFactor` (sf) opzionale (default 1.15)

## Output
- `injectionSpeedCm3s` (cm³/s)
- `screwRpm` (rpm)
- `backPressureBar` (bar)
- `holdingPressureBar` (bar)
- `meltTempZones` (°C array)
- `moldTemp` (°C)
- `coolingTimeSec` (s)
- `clampForceTon` (ton)
- `trace` (array di stringhe—spiega come sono stati calcolati valori)

## Flusso di calcolo (sintesi)
1. Normalizzazione input (unità, fallback volume se manca: V ≈ A * thicknessProxy)
2. Tempo di riempimento target `t_fill` stimato da `k_fill * sqrt(A)` o regole empiriche per geometria
3. Portata richiesta `Q_req = V / t_fill`
4. Conversione `Q_req` → `rpm` usando volume per giro stimato della vite
5. Stima `backPressure` in base a viscosità e Q_req
6. Stima `holdingPressure` come percentuale dell'injectionPressure (o valore empirico per la famiglia)
7. Temperatura melt/mold: profilo cilindro distribuito tra `meltMin` e `meltMax`; `moldTemp` scelto in range
8. Cooling time da `V/A` (proxy spessore) e proprietà termiche del materiale
9. Clamp force `F = projArea_m2 * cavityPressure * safetyFactor` → ton

## Heuristics e parametri configurabili
- `k_fill` (s/cm): regolabile per pezzi sottili/complessi
- `baseBackPressure` per viscosity categories
- `screwEffVolumePerRev` per pressa (se noto), altrimenti tabella per diametri

## Trace e audit
Ogni campo calcolato deve avere una stringa `trace` che spiega la formula e i valori usati.

---
Esempi numerici e formule dettagliate possono essere aggiunti su richiesta; questo file è lo spec di alto livello pronto per implementazione in `src/engine/calcEngine.ts`.
