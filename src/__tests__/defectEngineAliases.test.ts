import { applyDefectRules } from "../engine/defectEngine";

const sampleInput = {
  material: { id: 'pp', meltMin: 210, meltMax: 240, moldMin: 20, moldMax: 40, viscosity: 'medium', family: 'PP' },
  press: { id: 'p1', clampForceTon: 100 },
  screwDiameter: 18,
  projAreaCm2: 20,
  volumeCm3: 10,
};

describe('applyDefectRules alias handling', () => {
  test('maps packingPressureOverride -> holdingPressureOverride', () => {
    const rules = { packingPressureOverride: '+25%' } as any;
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, rules);
    expect(patchedInput.holdingPressureOverride).toBe('+25%');
    expect(trace.some(t => t.includes('set override') || t.includes('set holdingPressureOverride'))).toBeTruthy();
  });

  test('moldTemp override is applied to input', () => {
    const rules = { moldTemp: 45 } as any;
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, rules);
    expect(patchedInput.moldTemp).toBe(45);
  });
});
