import { analyzeCADFile } from "../cadAnalysis";
import * as cadParser from "../cadParser";

describe("analyzeCADFile cache reuse", () => {
  beforeAll(() => {
    // Jest/node: abilita crypto.subtle
    const { webcrypto } = require("node:crypto");
    (globalThis as any).crypto = webcrypto;
    // performance.now in node
    if (!(globalThis as any).performance) {
      (globalThis as any).performance = { now: () => Date.now() };
    }
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("second call with same file content uses cache (parseCAD called once)", async () => {
    const parseSpy = jest.spyOn(cadParser as any, "parseCAD").mockResolvedValue({
      volume_cm3: 1,
      area_cm2: 2,
      features: {},
      meshes: [],
      thickness_mm: 1.5,
    });

    const buf = new TextEncoder().encode("same-content").buffer;
    // Use a simple file-like object to avoid environment-specific File constructor
    const file: any = { name: "part.step", size: buf.byteLength, arrayBuffer: async () => buf };

    const r1 = await analyzeCADFile(file);
    const r2 = await analyzeCADFile(file);

    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(r2).toEqual(r1);
  });
});
