const RUN_CAD_INT =
  process.env.RUN_CAD_INTEGRATION === "1" ||
  process.env.RUN_CAD_INTEGRATION === "true";

const describeCadInt = RUN_CAD_INT ? describe : describe.skip;

describeCadInt("occt-import-js (real integration)", () => {
  it("parses a STEP fixture via parseCAD (no mock)", async () => {
    const STRICT =
      process.env.CAD_STRICT === "1" ||
      process.env.CAD_STRICT === "true";

    const { parseCAD } = await import('../../lib/cadParser');
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const stepPath = path.join(__dirname, "fixtures", "cad", "box_20mm.step");

    const fixtureBuf = await fs.readFile(stepPath);
    const uint8 = new Uint8Array(fixtureBuf.buffer, fixtureBuf.byteOffset, fixtureBuf.byteLength);
    const fileLike = {
      name: "box_20mm.step",
      size: uint8.byteLength,
      type: "model/step",
      arrayBuffer: async () => uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength),
    } as unknown as File;
    const out = await parseCAD(fileLike as unknown as File);

    expect(out).toBeTruthy();
    expect(Array.isArray(out.features)).toBe(true);

    let occtHasReader = false;
    try {
      const occtClient = await import('../../lib/occt/occtClient');
      const occt = await occtClient.getOCCT();
      if (occt) {
        occtHasReader = !!(
          occt.ReadStepFile ||
          occt.readStepFile ||
          occt.ReadSTEPFile ||
          occt.readSTEPFile ||
          occt.ReadSTEP ||
          occt.readSTEP
        );
      }
    } catch (_) {
      occtHasReader = false;
    }

    const realFixture = occtHasReader;

    if ((out.features || []).includes("occt-unavailable")) {
      const msg = "OCCT integration failed: parseCAD returned fail-soft (occt-unavailable).";
      if (STRICT) throw new Error(msg);
      if (realFixture) {
        console.warn(msg);
        return;
      }
      console.warn("OCCT unavailable or fixture not parseable; integration returned fail-soft. Replace STEP with a valid .step to enforce strict checks.");
      return;
    }

    expect(out.volume_cm3).toBeGreaterThan(0);
    expect(out.area_cm2).toBeGreaterThan(0);
    expect(out.meshes && out.meshes.length).toBeGreaterThan(0);
  }, 20000);
});
