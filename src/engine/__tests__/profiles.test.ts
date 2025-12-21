import { buildInjectionProfile } from "../profiles/buildInjectionProfile";
import { buildPackingProfile } from "../profiles/buildPackingProfile";

describe("multi-stage profiles", () => {
  test("simple PP -> 2 injection steps + 1 packing step", () => {
    const inj = buildInjectionProfile({
      materialId: "PP",
      thicknessAvg_mm: 2.5,
      thicknessMin_mm: 2.3,
      thicknessMax_mm: 2.7,
      shotUtilization: 0.35,
      speedUtilization: 0.40,
      pressureUtilization: 0.35,
      targetInjectionSpeed_cm3_s: 40,
      maxInjectionSpeed_cm3_s: 120,
      peakInjectionPressure_bar: 800,
      maxInjectionPressure_bar: 2000,
    });

    expect(inj.injectionSteps).toBe(2);
    expect(inj.injectionProfile).toHaveLength(2);
    expect(inj.switchover_volumePercent).toBeGreaterThanOrEqual(95);

    const pack = buildPackingProfile({
      materialId: "PP",
      thicknessAvg_mm: 2.5,
      thicknessMin_mm: 2.3,
      thicknessMax_mm: 2.7,
      shotUtilization: 0.35,
      speedUtilization: 0.40,
      pressureUtilization: 0.35,
      targetInjectionSpeed_cm3_s: 40,
      maxInjectionSpeed_cm3_s: 120,
      peakInjectionPressure_bar: 800,
      maxInjectionPressure_bar: 2000,
    });

    expect(pack.packingSteps).toBe(1);
    expect(pack.packingProfile).toHaveLength(1);
  });

  test("medium ABS -> 3 injection steps + 2 packing steps", () => {
    const inj = buildInjectionProfile({
      materialId: "ABS",
      thicknessAvg_mm: 3.0,
      thicknessMin_mm: 2.2,
      thicknessMax_mm: 3.8,
      shotUtilization: 0.60,
      speedUtilization: 0.65,
      pressureUtilization: 0.60,
      targetInjectionSpeed_cm3_s: 55,
      maxInjectionSpeed_cm3_s: 140,
      peakInjectionPressure_bar: 1100,
      maxInjectionPressure_bar: 2000,
    });

    expect(inj.injectionSteps).toBe(3);
    expect(inj.injectionProfile).toHaveLength(3);

    const pack = buildPackingProfile({
      materialId: "ABS",
      thicknessAvg_mm: 3.0,
      thicknessMin_mm: 2.2,
      thicknessMax_mm: 3.8,
      shotUtilization: 0.60,
      speedUtilization: 0.65,
      pressureUtilization: 0.60,
      targetInjectionSpeed_cm3_s: 55,
      maxInjectionSpeed_cm3_s: 140,
      peakInjectionPressure_bar: 1100,
      maxInjectionPressure_bar: 2000,
    });

    expect(pack.packingSteps).toBe(2);
    expect(pack.packingProfile).toHaveLength(2);
  });

  test("critical PA66 GF60 -> 5 injection steps + 4 packing steps, switchover later", () => {
    const inj = buildInjectionProfile({
      materialId: "PA66-GF60",
      thicknessAvg_mm: 3.8,
      thicknessMin_mm: 1.8,
      thicknessMax_mm: 5.2,
      shotUtilization: 0.88,
      speedUtilization: 0.90,
      pressureUtilization: 0.88,
      targetInjectionSpeed_cm3_s: 130,
      maxInjectionSpeed_cm3_s: 140,
      peakInjectionPressure_bar: 1900,
      maxInjectionPressure_bar: 2000,
    });

    expect(inj.injectionSteps).toBe(5);
    expect(inj.injectionProfile).toHaveLength(5);
    expect(inj.switchover_volumePercent).toBeGreaterThanOrEqual(96.0);

    const maxSpeed = Math.max(...inj.injectionProfile.map(s => s.speed_cm3_s));
    expect(maxSpeed).toBeLessThanOrEqual(140);

    const pack = buildPackingProfile({
      materialId: "PA66-GF60",
      thicknessAvg_mm: 3.8,
      thicknessMin_mm: 1.8,
      thicknessMax_mm: 5.2,
      shotUtilization: 0.88,
      speedUtilization: 0.90,
      pressureUtilization: 0.88,
      targetInjectionSpeed_cm3_s: 130,
      maxInjectionSpeed_cm3_s: 140,
      peakInjectionPressure_bar: 1900,
      maxInjectionPressure_bar: 2000,
    });

    expect(pack.packingSteps).toBe(4);
    expect(pack.packingProfile).toHaveLength(4);
    const maxP = Math.max(...pack.packingProfile.map(s => s.pressure_bar));
    expect(maxP).toBeLessThanOrEqual(2000);
  });
});
