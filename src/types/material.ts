export type MaterialId =
  | "pp"
  | "abs"
  | "pc"
  | "pa6"
  | "pa66"
  | "pa6-gf30"
  | "pa6-gf60"
  | "pa66-gf30"
  | "pa66-gf60";

export type DryingSpec = {
  required: boolean;
  tempC?: number;
  hours?: number;
  note?: string;
};

export type ShrinkSpec = {
  minPct: number;
  maxPct: number;
  note?: string;
};

export type MaterialProfile = {
  id: MaterialId;
  name: string;
  family: "PP" | "ABS" | "PC" | "PA6" | "PA66";
  gfPct?: 0 | 30 | 60;

  hygroscopic: boolean;
  drying: DryingSpec;

  meltTempC: { min: number; max: number; default: number };
  moldTempC: { min: number; max: number; default: number };

  shrink: ShrinkSpec;

  pressureFactor: number;
  flowFactor: number;
  coolingFactor: number;
};
