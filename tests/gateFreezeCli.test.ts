import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

describe("gate freeze CLI", () => {
  test("produces recommendations.json/csv", () => {
    const repoRoot = process.cwd();
    const inFile = path.join(repoRoot, "scripts/dev/fixtures_gate_freeze.csv");
    const outDir = path.join(repoRoot, "scripts/gate-freeze/out-test");

    fs.rmSync(outDir, { recursive: true, force: true });

    execFileSync(process.execPath, ["--import", "tsx", "scripts/gate-freeze/gateFreezeStudy.ts", "--in", inFile, "--outDir", outDir], {
      stdio: "pipe",
    });

    const outJson = path.join(outDir, "recommendations.json");
    const outCsv = path.join(outDir, "recommendations.csv");

    expect(fs.existsSync(outJson)).toBe(true);
    expect(fs.existsSync(outCsv)).toBe(true);

    const obj = JSON.parse(fs.readFileSync(outJson, "utf8"));
    expect(obj.recommendations.length).toBeGreaterThanOrEqual(2);

    const abs = obj.recommendations.find((r: any) => r.groupKey === "fp-ABS");
    expect(abs).toBeTruthy();
    expect(abs.method).toBe("weight_plateau");
    expect(abs.recommendedHoldingTime_s).toBeGreaterThan(0);
  });
});
