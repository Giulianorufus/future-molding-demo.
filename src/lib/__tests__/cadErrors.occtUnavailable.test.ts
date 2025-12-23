jest.resetModules();

jest.mock('../../lib/occt/occtClient', () => ({
  readSTEP: async () => { throw new Error('occt import failed'); }
}));

test('occt unavailable maps to CAD_ERR_OCCT_UNAVAILABLE', async () => {
  process.env.NODE_ENV = 'development';
  process.env.RUN_CAD_INTEGRATION = '0'; // ensure worker not used

  const { parseCAD } = await import('../cadParser');
  const fileLike: any = { name: 'model.step', arrayBuffer: async () => new ArrayBuffer(8) };
  const res = await parseCAD(fileLike);
  expect(res.error).toBeDefined();
  expect(res.error?.code).toBe('CAD_ERR_OCCT_UNAVAILABLE');
});
