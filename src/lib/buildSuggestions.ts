import { suggestInjectionProfile } from "@/utils/suggestInjectionProfile";
import { estimateClampingFromCad, autoAntiFlashAdjust } from "./clampingForce";
import { analyzeRunnerSystem } from "./clampingForce";

interface SuggestedParams {
  volumeCarica: number;
  cuscino: number;
  margine: number;
  Pc: number;
  numSteps: number;
  steps: Array<{
    speedCm3s: number;
    switchPosCm3: number;
    pressureBar: number;
  }>;
  temperatures?: {
    cilindro?: number[];
    ugello?: number;
    stampo?: number;
  };
  flashWarning?: string;
}

interface BuildSuggestionsParams {
  cad: {
    volume: number;
    thickness_min: number;
    thickness_max: number;
    thin_zones: boolean;
    long_runner: boolean;
    projectedArea_cm2: number;
    cavities?: number;
  } | null;
  pressa: {
    brand: string;
    screwDiam_mm: number;
    Vdot_max: number;
    Pmax: number;
    F_kN: number;
    zones?: number;
  } | null;
  materiale: {
    code: string;
    meltRange: [number, number];
    moldRange: [number, number];
    viscosity?: "bassa" | "media" | "alta";
    tipo?: string;
  } | null;
}

export function buildSuggestions({ cad, pressa, materiale }: BuildSuggestionsParams): SuggestedParams | null {
  if (!cad || !pressa || !materiale) return null;

  const Vcar = cad.volume;
  const defaultCuscino = 5;
  const defaultMargine = 5;
  const Pc = defaultCuscino + defaultMargine;

  // Base injection profile suggestion
  const profile = suggestInjectionProfile({
    Vcar,
    Pc,
    t_mm: cad.thickness_min,
    materiale: {
      tipo: materiale.tipo || "ABS",
      viscosita: materiale.viscosity || "media"
    },
    estetico: false,
    zoneSottili: cad.thin_zones,
    longRunner: cad.long_runner,
    difettiStorico: [],
    Vdot_max: pressa.Vdot_max,
    Pmax: pressa.Pmax,
    cadAnalysis: cad
  });

  // Build steps array
  const steps = profile.speedsCm3s.map((speed, i) => ({
    speedCm3s: speed,
    switchPosCm3: profile.switchesCm3[i] || 0,
    pressureBar: profile.pressuresBar[i] || 800
  }));

  // Temperature suggestions based on material
  const temperatures = {
    cilindro: Array(pressa.zones || 5).fill(0).map((_, i) => {
      const baseTemp = (materiale.meltRange[0] + materiale.meltRange[1]) / 2;
      return Math.round(baseTemp - (i * 10)); // Decreasing profile
    }),
    ugello: Math.round((materiale.meltRange[0] + materiale.meltRange[1]) / 2),
    stampo: Math.round((materiale.moldRange[0] + materiale.moldRange[1]) / 2)
  };

  // Clamping force analysis and anti-flash adjustments
  let flashWarning = "";
  let finalSteps = steps;
  let finalPc = Pc;

  if (cad.projectedArea_cm2 && cad.cavities) {
    const avgPressure = profile.pressuresBar.reduce((a, b) => a + b, 0) / profile.pressuresBar.length;
    const clampingResult = estimateClampingFromCad({
      projectedArea_cm2: cad.projectedArea_cm2,
      cavities: cad.cavities,
      p_eff_bar: avgPressure
    });

    if (clampingResult.F_req_sic_kN > pressa.F_kN) {
      const antiFlashResult = autoAntiFlashAdjust(
        {
          Vcar,
          Pc,
          speedsCm3s: profile.speedsCm3s,
          pressuresBar: profile.pressuresBar,
          temps: { nozzle: temperatures.ugello }
        },
        {
          Vdot_max: pressa.Vdot_max,
          Pmax: pressa.Pmax,
          F_pressa_kN: pressa.F_kN
        },
        clampingResult
      );

      finalSteps = antiFlashResult.speedsCm3s.map((speed, i) => ({
        speedCm3s: speed,
        switchPosCm3: profile.switchesCm3[i] || 0,
        pressureBar: antiFlashResult.pressuresBar[i]
      }));

      finalPc = antiFlashResult.Pc_adjusted;
      flashWarning = antiFlashResult.flashWarning;
      
      // Apply temperature adjustment
      if (antiFlashResult.temp_nozzle_adjustment !== 0) {
        temperatures.ugello += antiFlashResult.temp_nozzle_adjustment;
      }
    }
  }

  return {
    volumeCarica: Math.round(Vcar * 100) / 100,
    cuscino: defaultCuscino,
    margine: defaultMargine,
    Pc: Math.round(finalPc * 100) / 100,
    numSteps: profile.steps,
    steps: finalSteps,
    temperatures,
    flashWarning
  };
}