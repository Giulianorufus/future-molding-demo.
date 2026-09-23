import { calculateParameters, calcolaParametri } from '../calcEngine';
import { useDrawingStore } from '../../stores/drawingStore';

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

  test('marks the press inadequate when required clamp is below nominal but above 85%', () => {
    useDrawingStore.getState().reset();
    const out = calculateParameters({
      material: { ...dummyMaterial, family: 'PP' },
      press: { ...dummyPress, clampForceTon: 100 },
      screwDiameter: 22,
      projAreaCm2: 272.727,
      volumeCm3: 10,
    });
    expect(out.clampForceTon).toBe(90);
    expect(out.pressAdequate).toBe(false);
    expect(out.requiredTonnage_t).toBe(90);
    expect(out.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/85% nominale/)]));
  });

  test('preserves exact PP shot for four cavities and cold runner on ARBURG 370 U / 22 mm', () => {
    useDrawingStore.setState({
      volumeCm3: 4.326812032516769,
      surfaceCm2: 7.04,
      cavityCount: 4,
      cavityCountConfirmed: true,
      feedSystem: 'cold',
      runnerVolumeCm3: 2,
      runnerProjectedAreaCm2: 1,
    });
    try {
      const out = calculateParameters({
        material: { ...dummyMaterial, family: 'PP', id: 'PP-HOMO', crystalline: true },
        press: { ...dummyPress, id: 'arburg-370-u', clampForceTon: 60 },
        screwDiameter: 22,
        projAreaCm2: 7.04,
        volumeCm3: 4.326812032516769,
      });
      expect(out.shotVolumeCm3).toBe(19.307248);
      expect(out.totalPartsVolumeCm3).toBeCloseTo(17.307248130067076, 12);
      const wizardOutput = calcolaParametri({
        material: { id: 'PP-HOMO' },
        machine: { id: 'arburg-370-u', tonnellaggio_kN: 600, screwDiameter_mm: 22 },
        geometry: { volumePezzo_cm3: 4.326812032516769, areaProiettata_cm2: 7.04 },
      } as any);
      expect((wizardOutput as any).shotVolumeCm3).toBe(19.307248);
    } finally {
      useDrawingStore.getState().reset();
    }
  });
});
