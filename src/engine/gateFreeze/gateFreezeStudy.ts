export type GateFreezePoint = {
  holdingTime_s: number;
  weight_g?: number;        // preferito
  cycleTime_s?: number;     // fallback proxy (solo se weight_g assente)
  sourceId?: string;
};

export type GateFreezeOptions = {
  absEps_g?: number;        // tolleranza assoluta (g)
  relEps?: number;          // tolleranza relativa (% del peso plateau)
  minPoints?: number;       // punti minimi per decisione
};

export type GateFreezeResult = {
  recommendedHoldingTime_s: number;
  plateauWeight_g?: number;
  eps_g?: number;
  confidence: number;       // 0..1
  method: "weight_plateau" | "proxy_cycleTime" | "insufficient_data";
  details: {
    nPoints: number;
    usedKey: "weight_g" | "cycleTime_s" | "none";
    plateauIndex?: number;
  };
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function computeGateFreeze(pointsRaw: GateFreezePoint[], opts: GateFreezeOptions = {}): GateFreezeResult {
  const absEps_g = opts.absEps_g ?? 0.02;
  const relEps = opts.relEps ?? 0.0005; // 0.05%
  const minPoints = opts.minPoints ?? 4;

  const points = [...pointsRaw]
    .filter((p) => Number.isFinite(p.holdingTime_s))
    .sort((a, b) => a.holdingTime_s - b.holdingTime_s);

  if (points.length < minPoints) {
    return {
      recommendedHoldingTime_s: points.length ? points[points.length - 1].holdingTime_s : 0,
      confidence: 0,
      method: "insufficient_data",
      details: { nPoints: points.length, usedKey: "none" },
    };
  }

  const hasWeight = points.some((p) => Number.isFinite(p.weight_g));
  const usedKey: "weight_g" | "cycleTime_s" = hasWeight ? "weight_g" : "cycleTime_s";
  const method = hasWeight ? "weight_plateau" : "proxy_cycleTime";

  const series = points.map((p) => ({
    t: p.holdingTime_s,
    v: (hasWeight ? p.weight_g : p.cycleTime_s) as number | undefined,
  })).filter((x) => Number.isFinite(x.v)) as Array<{ t: number; v: number }>;

  if (series.length < minPoints) {
    return {
      recommendedHoldingTime_s: points[points.length - 1].holdingTime_s,
      confidence: 0.1,
      method: "insufficient_data",
      details: { nPoints: series.length, usedKey: "none" },
    };
  }

  // plateau = max(v); scegli il primo t tale che futureMax - v(t) <= eps
  const vmax = Math.max(...series.map((s) => s.v));
  const eps = Math.max(absEps_g, relEps * Math.abs(vmax));

  let bestIdx = series.length - 1;
  let futureMax = -Infinity;
  for (let i = series.length - 1; i >= 0; i--) {
    futureMax = Math.max(futureMax, series[i].v);
    if (futureMax - series[i].v <= eps) bestIdx = i;
  }

  const recommended = series[bestIdx].t;

  // confidence semplice: più punti e più “plateau netto” => più confidenza
  const spanT = series[series.length - 1].t - series[0].t;
  const plateauMargin = (vmax - series[0].v) || 0;
  const pointsFactor = clamp01((series.length - minPoints) / 8);
  const spanFactor = clamp01(spanT / 10); // 10s dà confidenza piena
  const marginFactor = clamp01(plateauMargin > 0 ? (plateauMargin / (10 * eps)) : 0); // se plateau visibile
  const confidence = clamp01(0.25 + 0.35 * pointsFactor + 0.25 * spanFactor + 0.15 * marginFactor);

  return {
    recommendedHoldingTime_s: recommended,
    plateauWeight_g: hasWeight ? vmax : undefined,
    eps_g: hasWeight ? eps : undefined,
    confidence,
    method,
    details: {
      nPoints: series.length,
      usedKey,
      plateauIndex: bestIdx,
    },
  };
}

