/**
 * Future Molding — Process Enhancers (post-calcolo)
 * - Gate freeze → pack time cap
 * - Clamp da area proiettata (bar cavità)
 * - Cooling efficiency da canali (η 0.6–1.0)
 * - Mold temp Fissa/Mobile automatiche
 *
 * Tutto opzionale/sicuro: se un dato manca, si usa un fallback e NON si rompe nulla.
 */

export type EnhancersInput = {
  material?: any; // materialSelected (deve avere almeno moldRange, name/code/tipo)
  pressa?: any;   // pressaSelezionata?.specs (limiti macchina)
  cad?: any;      // output opzionale analisi CAD (projectedArea_cm2, gate, cooling.channels, texture/ejection)
};

export type CalcResult = Record<string, any>;

const clampNum = (x: number, lo?: number, hi?: number) => {
  let v = Number(x);
  if (!Number.isFinite(v)) v = 0;
  if (typeof lo === 'number') v = Math.max(lo, v);
  if (typeof hi === 'number') v = Math.min(hi, v);
  return v;
};

const round0 = (x: number) => Math.round(x);
const round1 = (x: number) => Math.round(x * 10) / 10;

/* -------------------------- 1) Gate freeze → pack cap -------------------------- */
/**
 * Stima tempo di congelamento gate ~ k * t_gate^2
 * k base (s/mm^2) dipende dalla famiglia materiale (euristiche robuste):
 *  - semi-cristallini (PP, PE, PA, POM): 0.18
 *  - amorfi (ABS, PC, PMMA, PS): 0.25
 *  - default: 0.22
 */
function estimateGateFreezeTime_s(material: any, gateThickness_mm?: number): number | null {
  const t = gateThickness_mm && gateThickness_mm > 0 ? gateThickness_mm : null;
  if (!t) return null;
  const name = (material?.name || material?.code || material?.tipo || '').toString().toUpperCase();
  const isSemi = /(PP|PE|PA|POM|PE-HD|PEHD|PA6|PA66)/.test(name);
  const isAmorph = /(ABS|PC|PMMA|PS)/.test(name);
  const k = isSemi ? 0.18 : isAmorph ? 0.25 : 0.22;
  return k * t * t;
}

function applyGateFreezeCap(p: CalcResult, material: any, cad: any, notes: string[]) {
  const gateT = cad?.gate?.thickness_mm ?? cad?.gateThickness_mm;
  const tFreeze = estimateGateFreezeTime_s(material, gateT);
  if (!tFreeze) return;

  // Campi pack tempo: usa packTime_s (singolo) o packTimes_s (array) o niente
  if (typeof p.packTime_s === 'number') {
    const before = p.packTime_s;
    p.packTime_s = Math.min(p.packTime_s, round1(tFreeze));
    if (p.packTime_s < before) notes.push(`Pack time limitato al gate freeze ≈ ${round1(tFreeze)} s`);
  } else if (Array.isArray(p.packTimes_s) && p.packTimes_s.length) {
    const beforeMax = Math.max(...p.packTimes_s);
    p.packTimes_s = p.packTimes_s.map((t: number) => Math.min(t, round1(tFreeze)));
    const afterMax = Math.max(...p.packTimes_s);
    if (afterMax < beforeMax) notes.push(`Pack times limitati al gate freeze ≈ ${round1(tFreeze)} s`);
  } else {
    // Se non esiste un tempo pack esplicito, scrivi solo una nota informativa
    notes.push(`Gate freeze stimato ≈ ${round1(tFreeze)} s (verifica che il pack non vada oltre)`);
  }
}

/* -------------------- 2) Clamp da area proiettata (bar cavità) -------------------- */
/**
 * Force_kN ≈ 0.01 * P_cavity_bar * Area_cm2
 * Target P_cavity:
 *  - PP/PE: 350–450 bar → usa 400
 *  - ABS/PS/PMMA: 450–550 bar → usa 500
 *  - PC/PA/POM o caricate: 500–650 bar → usa 550
 */
function targetCavityBar(material: any): number {
  const name = (material?.name || material?.code || material?.tipo || '').toString().toUpperCase();
  if (/(PP|PE|PE-HD|PEHD)/.test(name)) return 400;
  if (/(ABS|PS|PMMA)/.test(name)) return 500;
  if (/(PC|PA|POM|GF|CF)/.test(name)) return 550;
  return 500;
}

function applyClampFromProjectedArea(p: CalcResult, material: any, cad: any, pressa: any, notes: string[]) {
  const area_cm2 = cad?.projectedArea_cm2 || cad?.areaProjected_cm2 || null;
  if (!area_cm2 || !Number.isFinite(area_cm2)) return;

  const Pbar = targetCavityBar(material);
  const force_kN = 0.01 * Pbar * area_cm2; // vedi formula sopra

  // Suggerisci un range operativo 60–85% della nominale, clampato alla macchina
  const nominal_kN = Number(pressa?.clampForce_kN) || null;
  const rec_kN = round0(force_kN);
  const low = round0(rec_kN * 1.05);  // un filo sopra
  const high = nominal_kN ? round0(Math.min(nominal_kN, rec_kN * 1.25)) : round0(rec_kN * 1.25);

  // Scrivi i campi di raccomandazione SENZA rompere quelli esistenti
  p.clampFromArea_kN = rec_kN;
  p.clampRecommendedRange_kN = [low, high];

  // Se hai un clamp_kN "consigliato" già presente, allinealo verso il range
  if (typeof p.clamp_kN === 'number') {
    p.clamp_kN = clampNum(p.clamp_kN, low, high);
  }

  notes.push(`Clamp da area proiettata: A=${round0(area_cm2)} cm², P_cav≈${Pbar} bar → ~${rec_kN} kN (range ${low}-${high})`);
}

/* -------------------- 3) Cooling efficiency dai canali (η) -------------------- */
/**
 * Stima η (0.6–1.0) da geometria canali:
 *  - ratio = distanza_parete / diametro_canale
 *  - ratio ideale ≈ 1.0–1.5 → η ~ 1.0
 *  - ratio > 2.5 → η ~ 0.65–0.7
 * Se mancano dati: η=0.75 (warning).
 */
function estimateCoolingEfficiency(cad: any): { eta: number; reason: string } {
  const channels = cad?.cooling?.channels || cad?.coolingChannels || [];
  if (!Array.isArray(channels) || channels.length === 0) {
    return { eta: 0.75, reason: 'assenza dati canali (fallback)' };
  }
  let scores: number[] = [];
  for (const ch of channels) {
    const d = Number(ch?.diameter_mm);
    const dist = Number(ch?.distanceToWall_mm ?? ch?.distance_mm);
    if (!Number.isFinite(d) || !Number.isFinite(dist) || d <= 0 || dist <= 0) continue;
    const ratio = dist / d;
    let eta = 1.0;
    if (ratio <= 1.0) eta = 1.0;
    else if (ratio <= 1.5) eta = 0.95;
    else if (ratio <= 2.0) eta = 0.9;
    else if (ratio <= 2.5) eta = 0.8;
    else if (ratio <= 3.0) eta = 0.7;
    else eta = 0.65;
    scores.push(eta);
  }
  if (!scores.length) return { eta: 0.75, reason: 'dati canali insufficienti (fallback)' };
  // prendi il peggiore (conservativo)
  const eta = Math.min(...scores);
  return { eta, reason: 'geometria canali' };
}

function applyCoolingEfficiency(p: CalcResult, cad: any, notes: string[]) {
  if (typeof p.coolingTime_s !== 'number') return;
  const { eta, reason } = estimateCoolingEfficiency(cad);
  const before = p.coolingTime_s;
  // Tempo reale ≈ tempo_base / η  (η<1 allunga il tempo)
  p.coolingTime_s = round1(p.coolingTime_s / eta);
  if (p.coolingTime_s > before) {
    notes.push(`Cooling penalizzato (η=${eta.toFixed(2)} da ${reason}) → tempo ${before}s → ${p.coolingTime_s}s`);
  }
}

/* -------------------- 4) Mold temp Fissa/Mobile automatiche -------------------- */
/**
 * Base = media del moldRange.
 * Correzioni minimal:
 *  - gate lato fissa → fissa +2°C
 *  - estrazione/texture → mobile −3°C
 * Clamp nel range materiale.
 */
function suggestMoldTemps(material: any, cad: any): { fixed: number; moving: number; comment: string } | null {
  const range = material?.moldRange || material?.moldRange_C;
  if (!Array.isArray(range) || range.length < 2) return null;
  const minR = Math.min(range[0], range[1]);
  const maxR = Math.max(range[0], range[1]);
  const clamp = (x: number) => Math.round(clampNum(x, minR, maxR));

  let base = (minR + maxR) / 2;

  let fixed = base;
  let moving = base;

  const gateSide = (cad?.gate?.side || cad?.gateSide || 'auto').toString().toLowerCase(); // 'fixed' | 'moving' | 'auto'
  const hardEject = !!(cad?.ejection?.hard || cad?.texture || cad?.undercuts);

  if (gateSide === 'fixed') fixed += 2;
  if (gateSide === 'moving') moving += 2;
  if (hardEject) moving -= 3;

  fixed = clamp(fixed);
  moving = clamp(moving);

  return { fixed, moving, comment: `moldRange ${minR}-${maxR}°C; gate:${gateSide}; estrazione:${hardEject?'difficile':'normale'}` };
}

function applyMoldTemps(p: CalcResult, material: any, cad: any, notes: string[]) {
  const s = suggestMoldTemps(material, cad);
  if (!s) return;
  if (typeof p.moldTempFixed_C !== 'number') p.moldTempFixed_C = s.fixed;
  if (typeof p.moldTempMoving_C !== 'number') p.moldTempMoving_C = s.moving;
  if (typeof p.moldTemp_C !== 'number') {
    // se hai ancora un campo unico, allinealo alla media
    p.moldTemp_C = Math.round((s.fixed + s.moving) / 2);
  }
  notes.push(`Temp stampo auto: Fissa ${p.moldTempFixed_C}°C, Mobile ${p.moldTempMoving_C}°C (${s.comment})`);
}

/* ----------------------------- Orchestratore unico ----------------------------- */
export function applyProcessEnhancers(result: CalcResult, ctx: EnhancersInput): CalcResult {
  const p: CalcResult = { ...result };
  const notes: string[] = Array.isArray(p.notes) ? [...p.notes] : [];

  try { applyGateFreezeCap(p, ctx.material, ctx.cad, notes); } catch {}
  try { applyClampFromProjectedArea(p, ctx.material, ctx.cad, ctx.pressa, notes); } catch {}
  try { applyCoolingEfficiency(p, ctx.cad, notes); } catch {}
  try { applyMoldTemps(p, ctx.material, ctx.cad, notes); } catch {}

  if (notes.length) p.notes = notes;
  return p;
}