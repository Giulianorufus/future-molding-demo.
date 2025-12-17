/**
 * Integration-like tests for occt lifecycle helpers.
 * These run only when RUN_CAD_INTEGRATION=1 to avoid loading OCCT in unit runs.
 */

jest.mock('@/lib/log', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const mockTerminate = jest.fn(async () => {});
const mockDispose = jest.fn(async () => {});
const mockWorkerTerminate = jest.fn(() => {});

jest.mock('occt-import-js', () => ({
  __esModule: true,
  default: jest.fn(async () => ({
    terminate: mockTerminate,
    dispose: mockDispose,
    _worker: { terminate: mockWorkerTerminate },
  })),
}));

import { getOcct, killOcct, scheduleUnloadOcct, clearUnloadSchedule, getOcctStatus } from '@/lib/occtInit';

const run = process.env.RUN_CAD_INTEGRATION === '1';
(run ? describe : describe.skip)('occtInit lifecycle', () => {
  jest.setTimeout(20000);

  afterEach(async () => {
    // ensure any scheduled timers are cleared
    clearUnloadSchedule();
  });

  afterAll(async () => {
    // ensure occt is killed and no handles remain
    try {
      // import killOcct dynamically to avoid hoisting issues
      await killOcct(1000, 0);
    } catch (_) {}
    clearUnloadSchedule();
  });

  test('getOcct initializes and returns instance', async () => {
    const inst = await getOcct();
    expect(inst).toBeDefined();
    const status = getOcctStatus();
    expect(status.initialized).toBe(true);
  });

  test('killOcct clears instance and returns true', async () => {
    await getOcct();
    const res = await killOcct(2000, 0);
    expect(res).toBe(true);
    expect(getOcctStatus().initialized).toBe(false);
  });

  test('scheduleUnloadOcct triggers kill after timeout', async () => {
    await getOcct();
    scheduleUnloadOcct(150);
    // wait longer than schedule
    await new Promise((r) => setTimeout(r, 400));
    expect(getOcctStatus().initialized).toBe(false);
  });

  test('concurrent killOcct: second call returns false', async () => {
    await getOcct();
    const p1 = killOcct(1000, 0);
    const p2 = killOcct(1000, 0);
    const r1 = await p1;
    const r2 = await p2;
    expect(r1).toBe(true);
    expect(r2).toBe(false);
  });
});
