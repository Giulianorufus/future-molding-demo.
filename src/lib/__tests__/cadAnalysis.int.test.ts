import type { Mock } from "jest-mock";

// 1) Mock del modulo cadParser PRIMA di importare cadAnalysis
jest.mock("../cadParser", () => ({
  __esModule: true,
  parseCAD: jest.fn(),
}));

import { parseCAD } from "../cadParser";

// avoid tight typing here; we only need a Jest mock helper
const parseCADMock = parseCAD as unknown as any;

const RUN_CAD =
  process.env.RUN_CAD_INTEGRATION === "1" ||
  process.env.RUN_CAD_INTEGRATION === "true";

const describeCad = RUN_CAD ? describe : describe.skip;

describeCad("cadAnalysis (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 2) Risposta finta, minimale, stabile (metti qui i campi che cadAnalysis legge davvero)
    parseCADMock.mockResolvedValue({
      meta: {
        volume_cm3: 12.3,
        thickness_mm: 2.1,
        bbox_mm: { x: 100, y: 50, z: 20 },
      },
      geometry: null,
    });
  });

  it("analyzes CAD file using mocked parseCAD (no OCCT)", async () => {
    // 3) Import dinamico: garantisce che il mock sia già attivo
    const { analyzeCADFile } = await import("../cadAnalysis");

    const fakeFile = {
      name: "test.step",
      arrayBuffer: async () => new TextEncoder().encode("dummy").buffer,
    };

    const result = await analyzeCADFile(fakeFile as unknown as File);

    expect(parseCADMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });
});
