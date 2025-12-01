export type ParsedOverride = { type: 'percent'|'absolute'|'add', val: number } | null;

export function parseOverride(value: string | number): ParsedOverride {
  if (typeof value === 'number') return { type: 'absolute', val: value };
  const s = value.trim();
  if (!s) return null;
  const pctMatch = s.match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (pctMatch) return { type: 'percent', val: Number(pctMatch[1]) };
  // match numbers with optional °C or s (seconds) or plain numbers
  const addMatch = s.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*(?:°C|C|s|sec|secs))?$/i);
  if (addMatch) return { type: 'add', val: Number(addMatch[1]) };
  const barMatch = s.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*bar)?$/i);
  if (barMatch) return { type: 'add', val: Number(barMatch[1]) };
  return null;
}
