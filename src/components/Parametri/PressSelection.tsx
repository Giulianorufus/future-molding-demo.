import React, { useMemo, useEffect } from "react";
import * as log from '@/lib/log';
import { usePressStore } from "@/store/pressStore";

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
  const brand = value?.pressId;
  const model = value?.modelId;
  const useModelScrew = value?.useModelScrew ?? true;
  const { brands, models, specs } = usePressStore();
  const modelsList = brand ? models[brand] || [] : [];
  useEffect(() => {
    if (brand) log.debug(`[PressSelection] brand=${brand} modelsFound=${modelsList.length}`);
  }, [brand, modelsList.length]);
  const selectedModel = brand && model ? specs[brand]?.[model] : undefined;
  const screwShown = useMemo(() => {
    if (useModelScrew) return selectedModel?.screwDiameter_mm ?? value?.screwDiameter_mm;
    return value?.screwDiameter_mm ?? selectedModel?.screwDiameter_mm;
  }, [useModelScrew, selectedModel, value?.screwDiameter_mm]);

    function set(partial: Partial<NonNullable<Props["value"]>>) {
      onChange({
        pressId: brand,
        modelId: model,
        screwDiameter_mm: value?.screwDiameter_mm,
        useModelScrew,
        ...partial,
      });
    }

    function handlePressChange(e: React.ChangeEvent<HTMLSelectElement>) {
      const nextBrand = e.target.value || undefined;
      onChange({ pressId: nextBrand, modelId: undefined, screwDiameter_mm: undefined, useModelScrew: true });
    }

    function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
      const nextModel = e.target.value || undefined;
      onChange({
        pressId: brand,
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
        set({ useModelScrew: false, screwDiameter_mm: screwShown ?? selectedModel?.screwDiameter_mm });
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
          value={brand ?? ""}
          onChange={handlePressChange}
          disabled={disabled}
        >
          <option value="">Seleziona brand</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Modello</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            value={model ?? ""}
            onChange={handleModelChange}
            disabled={!brand || disabled}
          >
            <option value="">{brand ? `Seleziona modello (${modelsList.length} disponibili)` : "Seleziona prima il brand"}</option>
            {modelsList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" className="h-4 w-4" checked={useModelScrew} onChange={handleToggleUseModel} disabled={!model || disabled} />
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
              disabled={disabled || useModelScrew || !model}
              placeholder={model ? "Inserisci diametro in mm" : "Seleziona prima il modello"}
            />
            <select
              className="border rounded-md px-2 py-2 text-xs bg-white disabled:opacity-60"
              value={screwShown ?? ""}
              onChange={e => handleScrewChange({ target: { value: e.target.value } } as any)}
              disabled={disabled || useModelScrew || !model}
              style={{ minWidth: 70 }}
            >
              <option value="">Standard</option>
              {[18, 22, 25, 28, 30, 35, 40, 45, 50, 60, 70].map((d) => (
                <option key={d} value={d}>{d} mm</option>
              ))}
            </select>
          </div>
        </div>

        {model && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
            {selectedModel?.clampForce_kN != null && (
              <span className="bg-gray-100 px-2 py-1 rounded">Forza chiusura: {selectedModel.clampForce_kN} kN</span>
            )}
            {screwShown != null && (
              <span className="bg-gray-100 px-2 py-1 rounded">Vite effettiva: {screwShown} mm {useModelScrew ? "(modello)" : "(manuale)"}</span>
            )}
          </div>
        )}
      </div>
    );
  }

