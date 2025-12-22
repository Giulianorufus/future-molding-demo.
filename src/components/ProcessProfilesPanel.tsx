function fmt(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return String(n);
}

import React from "react";
import type { CalcResult, ProcessProfile, Switchover, CalculationResultWithProfiles } from "../engine/calcEngine";
import type { CalculationResult } from "../core/calcEngine";

type UIResult = (CalcResult | CalculationResultWithProfiles | CalculationResult) & Partial<{
  injectionProfile: ProcessProfile;
  packingProfile: ProcessProfile;
  switchover: Switchover;
  switchover_volumePercent: Switchover;
}>;

export function ProcessProfilesPanel({ result }: { result: UIResult | null | undefined }) {
  if (!result) return null;

  const inj = result.injectionProfile?.steps ?? [];
  const pack = result.packingProfile?.steps ?? [];
  const sw = result.switchover ?? result.switchover_volumePercent;

  const hasAny = inj.length > 0 || pack.length > 0 || sw !== undefined;
  if (!hasAny) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Profili processo</h3>
        <div className="text-xs text-slate-600">
          V→P: <span className="font-semibold text-slate-900">{sw !== undefined ? `${fmt(sw)}%` : "—"}</span>
        </div>
      </div>

      {/* Profilo iniezione */}
      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-800">Profilo iniezione (cm³/s)</div>
        {inj.length === 0 ? (
          <div className="mt-1 text-xs text-slate-500">Non disponibile.</div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600">
                <tr>
                  <th className="py-2 pr-3">Step</th>
                  <th className="py-2 pr-3">Velocità</th>
                  <th className="py-2 pr-3">Fine step</th>
                </tr>
              </thead>
              <tbody className="text-slate-900">
                {inj.map((s) => (
                  <tr key={s.step} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{s.step}</td>
                    <td className="py-2 pr-3">{fmt(s.speed_cm3_s)}</td>
                    <td className="py-2 pr-3">
                      {s.endBy?.kind === "volumePercent" ? `${fmt(s.endBy.value)}% vol` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profilo mantenimento */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-800">Profilo mantenimento (bar / s)</div>
        {pack.length === 0 ? (
          <div className="mt-1 text-xs text-slate-500">Non disponibile.</div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600">
                <tr>
                  <th className="py-2 pr-3">Step</th>
                  <th className="py-2 pr-3">Pressione</th>
                  <th className="py-2 pr-3">Tempo</th>
                </tr>
              </thead>
              <tbody className="text-slate-900">
                {pack.map((s) => (
                  <tr key={s.step} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{s.step}</td>
                    <td className="py-2 pr-3">{fmt(s.pressure_bar)}</td>
                    <td className="py-2 pr-3">{s.time_s !== undefined ? `${fmt(s.time_s)} s` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessProfilesPanel;
