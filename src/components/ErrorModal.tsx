import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  action?: string;
  onClose: () => void;
};

export default function ErrorModal({ open, title, description, action, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-md p-4">
        <h3 className="text-lg font-semibold mb-2">{title || 'Errore'}</h3>
        <p className="text-sm text-slate-700 mb-3">{description}</p>
        {action ? <p className="text-xs text-muted-foreground mb-3"><strong>Suggerimento:</strong> {action}</p> : null}
        <div className="flex justify-end">
          <button className="px-3 py-1 rounded bg-slate-200 mr-2" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
