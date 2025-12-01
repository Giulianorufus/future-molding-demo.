export function info(...args: any[]) {
  // lightweight wrapper so we can later redirect logs
  // eslint-disable-next-line no-console
  console.info(...args);
}

export function warn(...args: any[]) {
  // eslint-disable-next-line no-console
  console.warn(...args);
}

export function error(...args: any[]) {
  // eslint-disable-next-line no-console
  console.error(...args);
}

export function debug(...args: any[]) {
  // eslint-disable-next-line no-console
  console.debug(...args);
}

export default { info, warn, error };
export const log = {
  info: (...a: unknown[]) => console.info("[FM]", ...a),
  warn: (...a: unknown[]) => console.warn("[FM]", ...a),
  error: (...a: unknown[]) => console.error("[FM]", ...a),
  debug: (...a: unknown[]) => console.debug("[FM]", ...a),
};