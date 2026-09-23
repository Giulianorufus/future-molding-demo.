
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
  const oldWorker = global.Worker;
  try {
    process.env.NODE_ENV = 'development';
    process.env.RUN_CAD_INTEGRATION = '1';
    process.env.CAD_PARSE_TIMEOUT_MS = '50'; // fast timeout
    // parseCAD checks Worker availability before using the injected worker.
    // Without this, jsdom falls through to real OCCT on an invalid STEP buffer.
    global.Worker = class {} as any;

    const cadParser = await import('../cadParser');

    // inject a fake worker that never responds
    const fake = {
      addEventListener: (_: any, __: any) => {},
      removeEventListener: (_: any, __: any) => {},
      postMessage: jest.fn(),
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
    expect(fake.postMessage).toHaveBeenCalledTimes(1);
  } finally {
    if (oldWorker === undefined) delete (global as any).Worker;
    else global.Worker = oldWorker;
    for (const [key, value] of Object.entries({ NODE_ENV: oldNodeEnv, RUN_CAD_INTEGRATION: oldRun, CAD_PARSE_TIMEOUT_MS: oldTimeout })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
