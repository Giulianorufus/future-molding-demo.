export type ParseMetric = {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  durationMs: number;
  timestamp: number;
  success: boolean;
  fallbackUsed?: boolean;
};

const KEY = 'app:metrics:parsing';

export function recordParseMetric(m: ParseMetric) {
  try {
    const raw = localStorage.getItem(KEY) || '[]';
    const arr = JSON.parse(raw) as ParseMetric[];
    arr.push(m);
    // keep only last 200 entries
    const trimmed = arr.slice(-200);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch (e) {
    // ignore
  }
}

export function getParseMetrics(): ParseMetric[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ParseMetric[];
  } catch (e) {
    return [];
  }
}

export default { recordParseMetric, getParseMetrics };
