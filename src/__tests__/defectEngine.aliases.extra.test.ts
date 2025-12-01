import { applyDefectRules } from "../engine/defectEngine";

const sampleInput = {
  material: { id: 'pp', meltMin: 210, meltMax: 240, moldMin: 20, moldMax: 40, viscosity: 'medium', family: 'PP' },
  press: { id: 'p1', clampForceTon: 100 },
  screwDiameter: 18,
  projAreaCm2: 20,
  volumeCm3: 10,
};

describe('applyDefectRules additional alias handling', () => {
  test('backPressure alias maps to backPressureBar', () => {
    const rules = { backPressure: '+10' } as any;
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, rules);
    expect((patchedInput as any).backPressureBar).toBeDefined();
    // parsed as add +10 -> original backPressureBar default in calc engine not present here,
    // but the engine/store expects string overrides to be preserved too
    expect(trace.some(t => t.includes('backPressureBar') || t.includes('backPressure'))).toBeTruthy();
  });

  test('clampForce alias maps to clampForceTon', () => {
    const rules = { clampForce: 120 } as any;
    const { patchedInput, trace } = applyDefectRules(sampleInput as any, rules);
    expect((patchedInput as any).clampForceTon).toBe(120);
    expect(trace.some(t => t.includes('clampForceTon'))).toBeTruthy();
  });
});
