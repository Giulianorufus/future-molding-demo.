jest.resetModules();

test('worker timeout returns CAD_ERR_TIMEOUT and recoverable=true', async () => {
  process.env.NODE_ENV = 'development';
  process.env.RUN_CAD_INTEGRATION = '1';
  process.env.CAD_PARSE_TIMEOUT_MS = '50';

  // Ensure runtime sees a Worker so worker-codepath is considered
  // and then inject a fake worker
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.Worker = class {} as any;

  const cadParser = await import('../cadParser');

  const fake = {
    addEventListener: (_: any, __: any) => {},
    removeEventListener: (_: any, __: any) => {},
    postMessage: (_: any) => {},
    terminate: jest.fn(),
  };
  cadParser.__setCadWorkerForTest(fake);

  const fileLike: any = { name: 'model.step', arrayBuffer: async () => new ArrayBuffer(8) };
  const res = await cadParser.parseCAD(fileLike);
  expect(res.error).toBeDefined();
  expect(res.error?.code).toBe('CAD_ERR_TIMEOUT');
  expect(res.error?.recoverable).toBe(true);
  // cleanup
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete global.Worker;
});
