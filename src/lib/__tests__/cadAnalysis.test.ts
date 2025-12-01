import { analyzeCADFile } from '../cadAnalysis';

describe('cadAnalysis fallback behavior', () => {
  test('fallback to simplified analysis when parser unavailable', async () => {
    const fake = new File([new Uint8Array([1,2,3])], 'test.step', { type: 'application/step' });
    const res = await analyzeCADFile(fake as any);
    expect(res).toHaveProperty('volume');
    expect(typeof res.volume).toBe('number');
    expect(res.cavities).toBeDefined();
  }, 20000);
});
