import React, { useMemo, useEffect } from "react";
import * as log from '@/lib/log';
import { usePressStore } from "@/stores/pressStore";

type Props = {
  value?: {
    pressId?: string;
    modelId?: string;
    screwDiameter_mm?: number;
    useModelScrew?: boolean;
  };
  onChange: (v: {
    pressId?: string;
    modelId?: string;
    screwDiameter_mm?: number;
    useModelScrew?: boolean;
  }) => void;
  disabled?: boolean;
  className?: string;
};

export default function PressSelection({ value, onChange, disabled, className = "" }: Props) {
  const selectedId = value?.pressId;
  const useModelScrew = value?.useModelScrew ?? true;
  const catalog = usePressStore((s) => s.catalog);
  const catalogList = Object.values(catalog || {}) as any[];
  useEffect(() => {
    log.debug(`[PressSelection] catalog entries=${catalogList.length}`);
  }, [catalogList.length]);
  const selectedModel = selectedId ? catalog[selectedId] : undefined;
  const screwShown = useMemo(() => {
    if (useModelScrew) return selectedModel?.screwDiameters?.[0] ?? value?.screwDiameter_mm;
    return value?.screwDiameter_mm ?? selectedModel?.screwDiameters?.[0];
  }, [useModelScrew, selectedModel, value?.screwDiameter_mm]);

    function set(partial: Partial<NonNullable<Props["value"]>>) {
      onChange({
        pressId: selectedId,
        modelId: undefined,
        screwDiameter_mm: value?.screwDiameter_mm,
        useModelScrew,
        ...partial,
      });
    }

    function handlePressChange(e: React.ChangeEvent<HTMLSelectElement>) {
      const nextId = e.target.value || undefined;
      onChange({ pressId: nextId, modelId: undefined, screwDiameter_mm: undefined, useModelScrew: true });
    }

    function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
      const nextModel = e.target.value || undefined;
      onChange({
        pressId: selectedId,
        modelId: nextModel,
        screwDiameter_mm: useModelScrew ? undefined : value?.screwDiameter_mm,
        useModelScrew,
      });
    }

    function handleToggleUseModel(e: React.ChangeEvent<HTMLInputElement>) {
      const checked = e.target.checked;
      if (checked) {
        set({ useModelScrew: true });
      } else {
        set({ useModelScrew: false, screwDiameter_mm: screwShown ?? selectedModel?.screwDiameters?.[0] });
      }
    }

    function handleScrewChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value;
      const n = val === "" ? undefined : Number(val);
      set({ screwDiameter_mm: Number.isFinite(n!) ? n : undefined });
    }

    return (
      <div className={`w-full ${className}`}>
        <label className="block text-sm font-medium text-gray-900 mb-1">Brand</label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          value={selectedId ?? ""}
          onChange={handlePressChange}
          disabled={disabled}
        >
          <option value="">Seleziona pressa</option>
          {catalogList.map((p) => (
            <option key={p.id} value={p.id}>{p.name} • {p.tonnellaggio} t</option>
          ))}
        </select>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Modello</label>
          {/* Model selection removed: catalog is flat (id -> spec). */}
          <div className="text-sm text-muted-foreground">Seleziona la pressa dal catalogo</div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" className="h-4 w-4" checked={useModelScrew} onChange={handleToggleUseModel} disabled={!selectedModel || disabled} />
              Usa valore modello
            </label>
          </div>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              min={8}
              max={80}
              step={1}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
              value={screwShown ?? ""}
              onChange={handleScrewChange}
              disabled={disabled || useModelScrew || !selectedModel}
              placeholder={selectedModel ? "Inserisci diametro in mm" : "Seleziona prima la pressa"}
            />
            <select
              className="border rounded-md px-2 py-2 text-xs bg-white disabled:opacity-60"
              value={screwShown ?? ""}
              onChange={e => handleScrewChange({ target: { value: e.target.value } } as any)}
              disabled={disabled || useModelScrew || !selectedModel}
              style={{ minWidth: 70 }}
            >
              <option value="">Standard</option>
              {[18, 22, 25, 28, 30, 35, 40, 45, 50, 60, 70].map((d) => (
                <option key={d} value={d}>{d} mm</option>
              ))}
            </select>
          </div>
        </div>

        {selectedModel && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
            {selectedModel?.tonnellaggio != null && (
              <span className="bg-gray-100 px-2 py-1 rounded">Tonnellaggio: {selectedModel.tonnellaggio} t</span>
            )}
            {screwShown != null && (
              <span className="bg-gray-100 px-2 py-1 rounded">Vite effettiva: {screwShown} mm {useModelScrew ? "(modello)" : "(manuale)"}</span>
            )}
          </div>
        )}
      </div>
    );
  }

