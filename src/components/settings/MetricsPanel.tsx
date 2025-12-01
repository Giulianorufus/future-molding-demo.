import React, { useEffect, useState } from 'react';
import { getParseMetrics } from '../../services/metrics';

type MetricRow = {
  id: string;
  fileName: string;
  fileSizeMB: number;
  durationMs: number;
  usedWorker: boolean;
  timestamp: string;
};

export const MetricsPanel: React.FC = () => {
  const [rows, setRows] = useState<MetricRow[]>([]);

  useEffect(() => {
    const raw = getParseMetrics();
    // adapt shape if needed
    const adapted = raw.map((r: any) => ({
      id: r.id || `${r.timestamp}-${Math.random().toString(16).slice(2)}`,
      fileName: r.fileName || r.fileName || 'n/a',
      fileSizeMB: ((r.fileSizeBytes ?? 0) / (1024 * 1024)),
      durationMs: r.durationMs ?? r.duration ?? 0,
      usedWorker: !!r.usedWorker,
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
    }));
    setRows(adapted);
  }, []);

  if (!rows.length) return <p className="text-sm opacity-80">Nessuna metrica registrata.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-left border-b">
            <th className="py-1 pr-4">File</th>
            <th className="py-1 pr-4">Dim. (MB)</th>
            <th className="py-1 pr-4">Durata (ms)</th>
            <th className="py-1 pr-4">Worker</th>
            <th className="py-1 pr-4">Quando</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="py-1 pr-4">{m.fileName}</td>
              <td className="py-1 pr-4">{m.fileSizeMB.toFixed(2)}</td>
              <td className="py-1 pr-4">{m.durationMs.toFixed(0)}</td>
              <td className="py-1 pr-4">{m.usedWorker ? 'sì' : 'no'}</td>
              <td className="py-1 pr-4">{new Date(m.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsPanel;
