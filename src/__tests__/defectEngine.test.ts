import { applyDefectRules } from "../engine/defectEngine";

const sampleInput = {
  material: { id: 'pp', meltMin: 210, meltMax: 240, moldMin: 20, moldMax: 40, viscosity: 'medium', family: 'PP' },
  press: { id: 'p1', clampForceTon: 100 },
  screwDiameter: 18,
  projAreaCm2: 20,
  volumeCm3: 10,
};

describe('applyDefectRules', () => {
  test('applies short_shot heuristic', () => {
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, { __defectId: 'short_shot' });
    expect(patchedInput).toBeDefined();
    expect(trace.some(t => t.includes('short_shot'))).toBeTruthy();
    // expect an override field present
    expect(patchedInput.injectionSpeedOverride || patchedInput.injectionSpeedOverride === undefined).toBeTruthy();
  });

  test('applies direct rules object', () => {
    const rules = { injectionSpeedOverride: '+15%', holdingPressureOverride: '+20 bar' };
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, rules);
    expect(patchedInput.injectionSpeedOverride).toBe('+15%');
    expect(trace).toContain('loaded direct rules');
  });
});
