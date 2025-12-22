import { buildInjectionProfile } from '../../src/engine/profiles/buildInjectionProfile.ts';
import { buildPackingProfile } from '../../src/engine/profiles/buildPackingProfile.ts';

function show(title: string, obj: any) {
  console.log('---', title, '---');
  console.log(JSON.stringify(obj, null, 2));
}

const samples = [
  {
    name: 'PP thin',
    input: {
      materialId: 'PP',
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
    },
  },
  {
    name: 'ABS medium',
    input: {
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
    },
  },
  {
    name: 'PA66 GF60',
    input: {
      materialId: 'PA66-GF60',
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
    },
  },
];

for (const s of samples) {
  const inj = buildInjectionProfile(s.input as any);
  const pack = buildPackingProfile(s.input as any);
  console.log(`\n== ${s.name} ==`);
  console.log('injectionSteps:', inj.injectionSteps);
  console.log('injectionProfile length:', inj.injectionProfile.length);
  console.log('switchover_volumePercent:', inj.switchover_volumePercent);
  console.log('packingSteps:', pack.packingSteps);
  console.log('packingProfile length:', pack.packingProfile.length);
}

console.log('\nDone');
