import DEFECT_RULES from "../data/defectRules";
import { CalcInput } from "./calcEngine";
import { parseOverride } from "../utils/overrides";

export interface ApplyResult {
  patchedInput: CalcInput;
  trace: string[];
}

type RulesMap = Record<string, any>;

function applySingleRule(newInput: any, key: string, val: any, trace: string[]) {
  // normalize some common alias keys to the canonical override names
  const aliasMap: Record<string, string> = {
    // packing / pack aliases
    packingPressureOverride: "holdingPressureOverride",
    packPressure: "holdingPressureOverride",
    packingPressure: "holdingPressureOverride",
    packPressureOverride: "holdingPressureOverride",
    // backpressure aliases
    backPressureBar: "backPressureBar",
    backPressure: "backPressureBar",
    backpressure: "backPressureBar",
    back_pressure: "backPressureBar",
    // clamp force aliases
    clampForceTon: "clampForceTon",
    clampForceOverride: "clampForceOverride",
    clampForce: "clampForceTon",
    clampTon: "clampForceTon",
    // mold temperature
    moldTemp: "moldTemp",
    moldTemperature: "moldTemp",
    moldTempC: "moldTemp",
  };
  const canonicalKey = aliasMap[key] ?? key;
  key = canonicalKey;
  // val can be string like +20% or number or function
  if (typeof val === "function") {
    try {
      const out = val(newInput);
      for (const [k2, v2] of Object.entries(out || {})) {
        applySingleRule(newInput, k2, v2, trace);
      }
      trace.push(`applied function rule for ${key}`);
      return;
    } catch (e) {
      trace.push(`error applying function rule for ${key}: ${String(e)}`);
      return;
    }
  }

  if (typeof val === "string") {
    const parsed = parseOverride(val);
    if (parsed && (key === "screwDiameter" || key === "projAreaCm2" || key === "volumeCm3")) {
      const curr = Number(newInput[key] ?? 0);
      if (parsed.type === "percent") {
        newInput[key] = Math.round(curr * (1 + parsed.val / 100));
        trace.push(`${key} ${curr} -> ${newInput[key]} (${val})`);
        return;
      }
      if (parsed.type === "add" || parsed.type === "absolute") {
        newInput[key] = Math.round(curr + parsed.val);
        trace.push(`${key} ${curr} -> ${newInput[key]} (${val})`);
        return;
      }
    }

    // preserve engine override fields (string overrides)
    if (key.endsWith("Override") || key === "injectionSpeedOverride" || key === "meltTempOverride" || key === "holdingPressureOverride") {
      newInput[key] = val;
      trace.push(`set override ${key} = ${val}`);
      return;
    }

    // fallback: set raw
    newInput[key] = val;
    trace.push(`set ${key} = ${val}`);
    return;
  }

  if (typeof val === "number" || typeof val === "boolean") {
    newInput[key] = val;
    trace.push(`set ${key} = ${val}`);
    return;
  }

  // default assignment
  newInput[key] = val;
  trace.push(`set ${key} = ${String(val)}`);
}

export function applyDefectRules(input: CalcInput, rulesOrDefect: RulesMap | { __defectId: string }): ApplyResult {
  const trace: string[] = [];
  const newInput: any = { ...input } as any;

  let rules: RulesMap = {};

  if ((rulesOrDefect as any).__defectId) {
    const id = (rulesOrDefect as any).__defectId as string;
    const def = DEFECT_RULES.find((d) => d.id === id);
    if (def) {
      rules = { ...(def.rules as RulesMap) };
      trace.push(`loaded defect rules for ${id}`);
    } else {
      trace.push(`defect id ${id} not found`);
    }

    // add a few built-in dynamic heuristics
    if (id === "short_shot") {
      const vol = (newInput as any).volumeCm3 ?? ((newInput.projAreaCm2 ? newInput.projAreaCm2 * 0.2 : 0) as number);
      const screw = (newInput as any).screwDiameter ?? 0;
      let injPct = vol < 5 ? 30 : vol < 20 ? 18 : 10;
      if (screw >= 30) injPct = Math.max(5, injPct - 6);
      else if (screw >= 25) injPct = Math.max(7, injPct - 4);
      rules = {
        ...rules,
        injectionSpeedOverride: `+${injPct}%`,
        holdingPressureOverride: `+${Math.round(injPct * 1.5)} bar`,
        meltTempOverride: `+5°C`,
      } as RulesMap;
      trace.push(`short_shot heuristic applied: +${injPct}%`);
    }
  } else {
    rules = { ...(rulesOrDefect as RulesMap) };
    trace.push(`loaded direct rules`);
  }

  // Apply function rules first, then percent/absolute
  // Iterate entries deterministic
  for (const [k, v] of Object.entries(rules)) {
    applySingleRule(newInput, k, v, trace);
  }

  return { patchedInput: newInput as CalcInput, trace };
}

export default {
  applyDefectRules,
};
