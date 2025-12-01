export function info(...args) {
    // lightweight wrapper so we can later redirect logs
    // eslint-disable-next-line no-console
    console.info(...args);
}

export function warn(...args) {
    // eslint-disable-next-line no-console
    console.warn(...args);
}

export function error(...args) {
    // eslint-disable-next-line no-console
    console.error(...args);
}

export function debug(...args) {
    // eslint-disable-next-line no-console
    console.debug(...args);
}

export default { info, warn, error, debug };

export const log = {
    info: (...a) => console.info("[FM]", ...a),
    warn: (...a) => console.warn("[FM]", ...a),
    error: (...a) => console.error("[FM]", ...a),
    debug: (...a) => console.debug("[FM]", ...a),
};
