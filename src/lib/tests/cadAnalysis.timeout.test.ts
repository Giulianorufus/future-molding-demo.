import { analyzeCADFile } from "../cadAnalysis";
import * as cadParser from "../cadParser";

describe("analyzeCADFile timeout fallback", () => {
  beforeAll(() => {
    // enable node webcrypto for hashing
    const { webcrypto } = require("node:crypto");
    (globalThis as any).crypto = webcrypto;
    if (!(globalThis as any).performance) (globalThis as any).performance = { now: () => Date.now() };
  });

  beforeEach(() => jest.restoreAllMocks());

  test("parseCAD slow -> timeout -> fallback returned", async () => {
    // shorten timeout in this test
    (process as any).CAD_PARSE_TIMEOUT_MS = undefined;
    process.env.CAD_PARSE_TIMEOUT_MS = "200";
    // mock parseCAD to be very slow (longer than PARSE_TIMEOUT_MS)
    // Return a pending promise (no timers) so withTimeout will trigger timeout rejection
    jest.spyOn(cadParser as any, "parseCAD").mockImplementation(() => new Promise(() => {}));

    const buf = new TextEncoder().encode("slow-content").buffer;
    const file: any = { name: "part.step", size: buf.byteLength, arrayBuffer: async () => buf };

    try {
      const res = await analyzeCADFile(file);

      // fallback produces 'features' containing 'fallback' and non-empty warnings
      expect(res.features).toContain("fallback");
      expect(res.warnings && res.warnings.length > 0).toBeTruthy();
    } finally {
      delete process.env.CAD_PARSE_TIMEOUT_MS;
    }
  });
});
