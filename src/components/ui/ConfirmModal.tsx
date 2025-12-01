import React, { useEffect, useRef } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ open, title = 'Conferma', message = '', onConfirm, onCancel }: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    // focus first actionable element
    setTimeout(() => firstButtonRef.current?.focus(), 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter') {
        // allow Enter to confirm when modal is open
        e.preventDefault();
        onConfirm();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      try { prevActive?.focus(); } catch (_) { }
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-hidden={!open}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" ref={dialogRef} className="w-full max-w-lg p-4 fm-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="confirm-title" className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap">{message}</p>
          </div>
          <div className="flex items-center gap-2">
            <button ref={firstButtonRef} onClick={onCancel} className="px-3 py-1 rounded btn-accent text-xs">Annulla</button>
            <button onClick={onConfirm} className="px-3 py-1 rounded btn-primary text-xs">Procedi</button>
          </div>
        </div>
      </div>
    </div>
  );
}
