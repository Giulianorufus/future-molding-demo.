
// Ensure parseCAD disposes worker on timeout

beforeAll(() => {
  // nothing
});

afterAll(() => {
  // restore if needed
});

test('parseCAD times out and disposes worker', async () => {
  jest.resetModules();
  const oldNodeEnv = process.env.NODE_ENV;
  const oldRun = process.env.RUN_CAD_INTEGRATION;
  const oldTimeout = process.env.CAD_PARSE_TIMEOUT_MS;
  try {
    process.env.NODE_ENV = 'development';
    process.env.RUN_CAD_INTEGRATION = '1';
    process.env.CAD_PARSE_TIMEOUT_MS = '50'; // fast timeout

    const cadParser = await import('../cadParser');

    // inject a fake worker that never responds
    const fake = {
      addEventListener: (_: any, __: any) => {},
      removeEventListener: (_: any, __: any) => {},
      postMessage: (_: any) => {},
      terminate: jest.fn(),
    };
    cadParser.__setCadWorkerForTest(fake);

    const fileLike: any = {
      name: 'model.step',
      arrayBuffer: async () => new ArrayBuffer(8),
    };

    const res = await cadParser.parseCAD(fileLike);

    // fail-soft: risultato vuoto/di fallback
    expect(res).toMatchObject({
      volume_cm3: 0,
      area_cm2: 0,
      meshes: [],
    });

    // cleanup chiamato almeno una volta (worker terminate)
    expect(fake.terminate).toHaveBeenCalled();
  } finally {
    process.env.NODE_ENV = oldNodeEnv;
    process.env.RUN_CAD_INTEGRATION = oldRun;
    process.env.CAD_PARSE_TIMEOUT_MS = oldTimeout;
  }
});
