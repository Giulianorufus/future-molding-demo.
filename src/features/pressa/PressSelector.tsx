// src/features/pressa/PressSelector.tsx
import * as React from "react";
import { getBrands, getModelsByBrand, type Brand } from "@/fm-core";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Props = {
  brand?: Brand;
  modelId?: string;
  onBrandChange: (b: Brand | undefined) => void;
  onModelChange: (m: string | undefined) => void;
  disabled?: boolean;
};

function normalizeBrand(input?: string): Brand | undefined {
  if (!input) return undefined;
  const norm = input.trim().toLowerCase();
  const map: Record<string, Brand> = {
    arburg: "Arburg",
    engel: "Engel",
    kraussmaffei: "KraussMaffei",
    "krauss-maffei": "KraussMaffei",
  };
  return map[norm] ?? (["Arburg", "Engel", "KraussMaffei"].includes(input) ? (input as Brand) : undefined);
}

export default function PressSelector({ brand, modelId, onBrandChange, onModelChange, disabled }: Props) {
  const brands = React.useMemo(() => getBrands().filter((v, i, a) => a.indexOf(v) === i), []);
  const [localBrand, setLocalBrand] = React.useState<Brand | undefined>(normalizeBrand(brand));
  const models = React.useMemo(() => getModelsByBrand(localBrand), [localBrand]);

  React.useEffect(() => {
    setLocalBrand(normalizeBrand(brand));
  }, [brand]);

  function handleBrandChange(val: string) {
    const b = normalizeBrand(val);
    setLocalBrand(b);
    onBrandChange?.(b);
    onModelChange?.(undefined);
  }

  function handleModelChange(val: string) {
    onModelChange?.(val || undefined);
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Marca pressa</Label>
        <Select disabled={disabled} value={localBrand ?? ""} onValueChange={handleBrandChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona marca" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Modello</Label>
        <Select disabled={disabled || !localBrand} value={modelId ?? ""} onValueChange={handleModelChange}>
          <SelectTrigger>
            <SelectValue placeholder={localBrand ? "Seleziona modello" : "Seleziona prima la marca"} />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

