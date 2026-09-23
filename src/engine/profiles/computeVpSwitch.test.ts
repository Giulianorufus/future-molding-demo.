import { buildInjectionProfile } from "./buildInjectionProfile";
import { computeVpSwitch } from "./computeVpSwitch";

describe("commutazione V/P riferita alla stampata", () => {
  const parts = 4.326812032516769 * 4;

  test("PP quattro cavità con canali freddi: la dose resta esatta", () => {
    const point = computeVpSwitch({ totalPartsVolumeCm3: parts, runnerVolumeCm3: 2 }, 97.5);
    expect(point?.injectedVolumeCm3).toBe(18.874567);
    expect(point?.shotPercent).toBeCloseTo(18.874567 / 19.307248 * 100, 10);
    expect(point?.injectedVolumeCm3).toBeLessThan(19.307248);
  });

  test("canale caldo: nessun volume di canale entra nella dose", () => {
    const point = computeVpSwitch({ totalPartsVolumeCm3: parts, runnerVolumeCm3: 0 }, 97.5);
    expect(point?.injectedVolumeCm3).toBe(16.874567);
    expect(point?.shotPercent).toBeCloseTo(97.5, 4);
  });

  test("rifiuta volumi non fisici o percentuali fuori intervallo", () => {
    expect(computeVpSwitch({ totalPartsVolumeCm3: 0, runnerVolumeCm3: 2 }, 97.5)).toBeNull();
    expect(computeVpSwitch({ totalPartsVolumeCm3: parts, runnerVolumeCm3: -1 }, 97.5)).toBeNull();
    expect(computeVpSwitch({ totalPartsVolumeCm3: parts, runnerVolumeCm3: 2 }, 100)).toBeNull();
  });

  test("le fasi terminano entro V/P e il tempo somma le rispettive portate", () => {
    const profile = buildInjectionProfile({
      materialId: "PP",
      totalPartsVolumeCm3: parts,
      runnerVolumeCm3: 2,
      targetInjectionSpeed_cm3_s: 40,
      maxInjectionSpeed_cm3_s: 120,
      peakInjectionPressure_bar: 800,
      maxInjectionPressure_bar: 2000,
    });
    expect(profile.switchover_volumeCm3).toBe(18.874567);
    expect(profile.switchover_timeMs).toBeGreaterThan(0);
    const endpoints = profile.injectionProfile.map((stage) => stage.endBy.value);
    expect(endpoints[0]).toBeGreaterThan(10);
    expect(endpoints.at(-1)).toBeCloseTo(profile.switchover_volumePercent, 10);
    expect(endpoints.every((value) => value <= profile.switchover_volumePercent)).toBe(true);
    expect(endpoints.every((value, index) => index === 0 || value >= endpoints[index - 1])).toBe(true);
    expect(profile.switchover_timeMs).toBeGreaterThan(Math.round(18.874567 / 40 * 1000));
  });
});
