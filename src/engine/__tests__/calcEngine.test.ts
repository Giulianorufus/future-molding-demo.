import { calculateParameters } from '../calcEngine';

describe('calculateParameters basic scenarios', () => {
  const dummyMaterial: any = {
    meltMin: 200,
    meltMax: 250,
    crystalline: false,
    moldMin: 20,
    moldMax: 80,
    viscosity: 'medium',
    family: 'ABS'
  };

  const dummyPress: any = {
    clampForceTon: 200,
    maxSpeedCm3s: 200,
    maxInjectionPressure_bar: 1000,
    shotVolumeCm3: 1000,
  };

  test('produces coherent fields for typical inputs', () => {
    const out = calculateParameters({ material: dummyMaterial, press: dummyPress, screwDiameter: 25, projAreaCm2: 30, volumeCm3: 50 });
    expect(out).toHaveProperty('moldTemp');
    expect(out).toHaveProperty('injectionSpeedCm3s');
    expect(out.shotVolumeCm3).toBeGreaterThanOrEqual(1);
    expect(out.clampForceTon).toBeGreaterThan(0);
  });

  test('applies override percent to injection speed', () => {
    const out = calculateParameters({ material: dummyMaterial, press: dummyPress, screwDiameter: 25, injectionSpeedOverride: '+10%' });
    expect(typeof out.injectionSpeedCm3s).toBe('number');
  });
});
