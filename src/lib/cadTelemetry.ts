type TelemetrySnapshot = {
  cacheHits: number;
  cacheMisses: number;
  timeoutCount: number;
  parseCount: number;
  totalParseMs: number;
};

const telemetry: TelemetrySnapshot = {
  cacheHits: 0,
  cacheMisses: 0,
  timeoutCount: 0,
  parseCount: 0,
  totalParseMs: 0,
};

export function recordCacheHit() {
  telemetry.cacheHits += 1;
}

export function recordCacheMiss() {
  telemetry.cacheMisses += 1;
}

export function recordTimeout() {
  telemetry.timeoutCount += 1;
}

export function recordParse(durationMs: number) {
  telemetry.parseCount += 1;
  telemetry.totalParseMs += Math.max(0, Math.round(durationMs));
}

export function getTelemetry() : TelemetrySnapshot {
  return { ...telemetry };
}

export function clearTelemetry() {
  telemetry.cacheHits = 0;
  telemetry.cacheMisses = 0;
  telemetry.timeoutCount = 0;
  telemetry.parseCount = 0;
  telemetry.totalParseMs = 0;
}

export function averageParseMs(): number {
  return telemetry.parseCount === 0 ? 0 : telemetry.totalParseMs / telemetry.parseCount;
}

export default {
  recordCacheHit,
  recordCacheMiss,
  recordTimeout,
  recordParse,
  getTelemetry,
  clearTelemetry,
  averageParseMs,
};
