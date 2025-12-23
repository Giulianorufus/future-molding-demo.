import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function writeText(fp: string, s: string) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, s, "utf8");
}

describe("gate-freeze-study.mjs (integration)", () => {
  it("produces summary.csv with a non-null recommendation", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gate-freeze-"));
    const inCsv = path.join(tmp, "sample-gate-freeze.csv");
    const outDir = path.join(tmp, "out");

    writeText(
      inCsv,
      [
        "recipeFingerprint,materialId,pressId,producedQty,scrapQty,defect,cycleTime_s,holdingTime_s,partWeight_g,notes",
        "rfp1,PP,AR100,1000,40,short_shot,18.2,0.4,12.05,test",
        "rfp1,PP,AR100,1000,38,short_shot,18.3,0.4,12.06,test",
        "rfp1,PP,AR100,1000,28,short_shot,18.4,0.6,12.18,test",
        "rfp1,PP,AR100,1000,25,short_shot,18.5,0.6,12.19,test",
        "rfp1,PP,AR100,1000,15,ok,18.8,0.8,12.29,test",
        "rfp1,PP,AR100,1000,14,ok,18.8,0.8,12.30,test",
        "rfp1,PP,AR100,1000,8,ok,19.0,1.0,12.33,test",
        "rfp1,PP,AR100,1000,7,ok,19.0,1.0,12.34,test",
        "rfp1,PP,AR100,1000,4,ok,19.1,1.2,12.35,test",
        "rfp1,PP,AR100,1000,4,ok,19.1,1.2,12.35,test",
        "rfp1,PP,AR100,1000,3,ok,19.2,1.4,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.2,1.4,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.2,1.6,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.2,1.6,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,1.8,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,1.8,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,2.0,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,2.0,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,2.2,12.36,test",
        "rfp1,PP,AR100,1000,3,ok,19.3,2.2,12.36,test",
        "",
      ].join("\n")
    );

    const scriptPath = path.resolve(process.cwd(), "tools", "gate-freeze-study.mjs");

    const res = spawnSync(process.execPath, [scriptPath, "--in", inCsv, "--out", outDir], {
      encoding: "utf8",
    });

    expect(res.status).toBe(0);

    const summaryCsv = path.join(outDir, "summary.csv");
    expect(fs.existsSync(summaryCsv)).toBe(true);

    const lines = fs.readFileSync(summaryCsv, "utf8").trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const header = lines[0].split(",");
    const row = lines[1].split(",");

    const idxRec = header.indexOf("recommended_hold_s");
    const idxReason = header.indexOf("reason");
    expect(idxRec).toBeGreaterThan(-1);
    expect(idxReason).toBeGreaterThan(-1);

    const recommended = row[idxRec];
    const reason = row[idxReason];

    expect(recommended).toBeTruthy(); // non vuoto
    expect(Number(recommended)).toBeGreaterThan(0);
    expect(reason).toBeTruthy();
  });
});
