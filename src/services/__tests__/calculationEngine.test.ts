import { calculateInjection } from '../calculationEngine';

describe('calculateInjection', () => {
  test('returns success and numeric values for valid inputs with null material', () => {
    const res = calculateInjection({ spessore: 2, volumeCavita: 10, volumeMaterozza: 2, cushion: 1 }, 'Generic', 'ModelX', null as any);
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(typeof res.weight).toBe('number');
    expect(res.weight).toBeGreaterThan(0);
    expect(typeof res.cycleTime).toBe('number');
    expect(res.injectionPressure_bar).toBeGreaterThanOrEqual(5);
  });

  test('invalid inputs (zero thickness) fail with error', () => {
    const res = calculateInjection({ spessore: 0, volumeCavita: 10, volumeMaterozza: 0, cushion: 1 }, 'Generic', 'ModelX', null as any);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length).toBeGreaterThan(0);
  });

  test('large cavity produces larger injection speed and tonnage estimate', () => {
    const small = calculateInjection({ spessore: 2, volumeCavita: 5, volumeMaterozza: 0, cushion: 1 }, 'Generic', 'ModelX', null as any);
    const large = calculateInjection({ spessore: 2, volumeCavita: 200, volumeMaterozza: 0, cushion: 1 }, 'Generic', 'ModelX', null as any);
    expect(large.injectionSpeed_cm3s).toBeGreaterThanOrEqual(small.injectionSpeed_cm3s);
    expect(large.requiredTonnage_t).toBeGreaterThanOrEqual(small.requiredTonnage_t);
  });

  test('calculates weight using material density and returns shrinkage', () => {
    const params = { spessore: 2, volumeCavita: 50, volumeMaterozza: 10, cushion: 2 };
    const material = { name: 'TestMat', density_g_cm3: 1.0, recommendedInjectionSpeed_cm3s: [10, 200], recommendedPackPressure_bar: 60, shrinkage_percent: 0.8 } as any;
    const res = calculateInjection(params, 'TestBrand' as any, 'ModelX', material);
    expect(res.success).toBe(true);
    // weight = (50+10)*1.0 = 60 g
    expect(res.weight).toBeCloseTo(60, 1);
    expect((res as any).shrinkage_percent).toBeCloseTo(0.8, 2);
  });
});
