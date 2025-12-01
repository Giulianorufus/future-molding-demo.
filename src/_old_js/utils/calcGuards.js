// Guardie da usare nel calcEngine per evitare NaN/loop
import { clamp } from "./validate";
export const safe = (n, def = 0) => {
    const t = typeof n === "string" ? Number(n.replace(",", ".")) : n;
    return Number.isFinite(t) ? t : def;
};
export function safeCommSwitch(total_cm3, cushion_cm3) {
    const T = clamp(safe(total_cm3), 0, 1e6);
    const C = clamp(safe(cushion_cm3), 0, T);
    return clamp(T - C, 0, T);
}
