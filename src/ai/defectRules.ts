import { CalcOutput } from "../engine/calcTypes";

export const defectRules: Record<string, (o: CalcOutput) => CalcOutput> = {
  "Short shot": (o) => ({
    ...o,
    velIniezione: (o.velIniezione ?? 0) + 10,
    pressioneIniezione: (o.pressioneIniezione ?? 0) + 80,
    vp: (o.vp ?? 0) + ((o.volumeTotale ?? 0) * 0.02),
    packPressione: (o.packPressione ?? 0) + 40,
    suggerimenti: [
      ...(o.suggerimenti ?? []),
      "Short Shot: aumentata velocità, pressione e posticipato VP.",
    ],
  }),

  "Cicca / Incompleto": (o) => ({
    ...o,
    velIniezione: (o.velIniezione ?? 0) + 15,
    pressioneIniezione: (o.pressioneIniezione ?? 0) + 100,
    packPressione: (o.packPressione ?? 0) + 30,
    suggerimenti: [
      ...(o.suggerimenti ?? []),
      "Cicca: maggiore velocità e pressione per riempimento totale.",
    ],
  }),

  "Bave": (o) => ({
    ...o,
    pressioneIniezione: (o.pressioneIniezione ?? 0) - 80,
    packPressione: (o.packPressione ?? 0) - 50,
    suggerimenti: [
      ...(o.suggerimenti ?? []),
      "Bave: ridotte pressioni e pack per chiusura stampo più stabile.",
    ],
  }),

  "Bruciatura": (o) => ({
    ...o,
    velIniezione: Math.max(0, (o.velIniezione ?? 0) - 20),
    temperature: {
      ...o.temperature,
      z1: (o.temperature.z1 ?? 0) - 10,
      z2: (o.temperature.z2 ?? 0) - 10,
      z3: (o.temperature.z3 ?? 0) - 10,
      z4: (o.temperature.z4 ?? o.temperature.z3 ?? 0) - 10,
    },
    suggerimenti: [
      ...(o.suggerimenti ?? []),
      "Bruciatura: ridotta velocità e temperature cilindro.",
    ],
  }),

  "Opacità superficie": (o) => ({
    ...o,
    temperature: {
      ...o.temperature,
      stampo: ((o.temperature.stampo ?? 50) + 10),
    },
    suggerimenti: [
      ...(o.suggerimenti ?? []),
      "Opacità: temperatura stampo aumentata per finitura migliore.",
    ],
  }),
};

export default defectRules;
