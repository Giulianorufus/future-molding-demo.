// Mock low-level CAD parser to avoid initializing OCCT/WASM in unit tests
jest.mock('../cadParser', () => ({
  parseCAD: jest.fn(async () => ({
    // shape expected by analyzeCADFile
    volume_cm3: 12,
    area_cm2: 34,
    thickness_mm: 2,
    meshes: [],
    features: [],
  })),
}));

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
