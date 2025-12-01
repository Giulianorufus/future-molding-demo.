import React, { useState } from 'react';
import { exportBackup, importBackup } from '../../services/storage';

export const BackupControls: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setStatus('Esportazione in corso...');
      const blob = await exportBackup();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `future-molding-backup-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus('Backup esportato.');
    } catch (err) {
      setStatus(`Errore durante export: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatus('Import in corso...');
      const text = await file.text();
      const json = JSON.parse(text);
      await importBackup(new Blob([JSON.stringify(json)], { type: 'application/json' }));
      setStatus('Backup importato correttamente. Ricarica la pagina.');
    } catch (err) {
      setStatus(`Errore durante import: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-2 rounded-lg text-sm font-medium border"
        >
          Esporta backup
        </button>

        <label className="px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer">
          Importa backup
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
      {status && <p className="text-xs opacity-80">{status}</p>}
    </div>
  );
};

export default BackupControls;
