import React, { useState } from "react";
import { CalcAudit } from "@/types/audit";

type Props = { audit?: CalcAudit };

export default function AuditPanel({ audit }: Props) {
  const [open, setOpen] = useState(false);
  if (!audit) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-md bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>Audit calcolo – Run {audit.runId}</span>
        <span className={`text-xs rounded px-2 py-0.5 ${audit.ok ? "bg-success text-white" : "bg-red-200 text-red-800"}`}>
          {audit.ok ? "OK" : "Problemi"}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 text-xs text-gray-800 space-y-3">
          <div>
            <div className="font-semibold">Inputs</div>
            <pre className="overflow-auto bg-white border rounded p-2">{JSON.stringify(audit.inputs, null, 2)}</pre>
          </div>
          {audit.derived && (
            <div>
              <div className="font-semibold">Derivati</div>
              <pre className="overflow-auto bg-white border rounded p-2">{JSON.stringify(audit.derived, null, 2)}</pre>
            </div>
          )}
          <div>
            <div className="font-semibold">Passi</div>
            <ul className="list-disc ml-5">
              {audit.steps.map((s, i) => (
                <li key={i}>
                  [{new Date(s.at).toLocaleTimeString()}] <strong>{s.label}</strong> {s.level && `(${s.level})`}
                  {s.data && <pre className="overflow-auto bg-white border rounded p-2 mt-1">{JSON.stringify(s.data, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          </div>
          {audit.outputs && (
            <div>
              <div className="font-semibold">Output</div>
              <pre className="overflow-auto bg-white border rounded p-2">{JSON.stringify(audit.outputs, null, 2)}</pre>
            </div>
          )}
          {audit.validations && audit.validations.length > 0 && (
            <div>
              <div className="font-semibold">Validazioni</div>
              <ul className="list-disc ml-5">
                {audit.validations.map((v, i) => (
                  <li key={i}>[{v.severity}] {v.msg}{v.field ? ` – campo: ${v.field}` : ""}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-gray-600">Durata: {audit.durationMs} ms</div>
        </div>
      )}
    </div>
  );
}

