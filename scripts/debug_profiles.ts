import { buildInjectionProfile } from '../src/engine/profiles/buildInjectionProfile';
import { buildPackingProfile } from '../src/engine/profiles/buildPackingProfile';

async function main() {
  const input = {
    materialId: 'ABS',
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
  } as any;

  const inj = buildInjectionProfile(input);
  const pack = buildPackingProfile(input);

  console.log(JSON.stringify({
    injSteps: inj.injectionSteps ?? null,
    packSteps: pack.packingSteps ?? null,
    switchover: inj.switchover_volumePercent ?? null,
    injectionProfile: inj.injectionProfile ?? null,
    packingProfile: pack.packingProfile ?? null,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
