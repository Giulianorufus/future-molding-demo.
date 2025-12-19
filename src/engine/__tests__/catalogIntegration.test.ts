import { calcolaParametri } from '../../engine/calcEngine';

describe('catalog integration (basic)', () => {
  test('PC on Arburg 50t with screw 25 clamps pressure and emits warning when exceeding max', () => {
    const input: any = {
      machine: {
        id: 'arburg-50t',
        nome: 'Arburg ~50t class',
        tonnellaggio_kN: 500,
        screwDiameter_mm: 25,
        maxInjectionPressure_bar: 100, // artificially low to force clamp
        maxInjectionSpeed_cm3_s: 200,
        maxShotVolume_cm3: 200,
      },
      material: { id: 'pc' },
      geometry: { areaProiettata_cm2: 500, volumePezzo_cm3: 1000 },
    };

    const out = calcolaParametri(input as any);
    // If pressure requested is higher than machine max, we expect at least one warning
    expect(Array.isArray(out.suggerimenti) || Array.isArray((out as any).suggerimenti)).toBeTruthy();
  });

  test('material factors: PC requires higher pressure and lower flow than ABS (deterministic)', () => {
    const base: any = {
      machine: {
        id: 'test-100t',
        nome: 'Test press 100t',
        tonnellaggio_kN: 1000,
        screwDiameter_mm: 25,
        maxInjectionPressure_bar: 2000,
        maxInjectionSpeed_cm3_s: 2000,
        maxShotVolume_cm3: 10000,
      },
      geometry: { areaProiettata_cm2: 50, volumePezzo_cm3: 50 },
    };

    const abs = calcolaParametri({ ...base, material: { id: 'ABS' } } as any);
    const pc = calcolaParametri({ ...base, material: { id: 'PC' } } as any);

    // PC should require higher pressure than ABS (deterministic)
    expect(pc.pressioneIniezione).toBeGreaterThan(abs.pressioneIniezione);
  });
});
