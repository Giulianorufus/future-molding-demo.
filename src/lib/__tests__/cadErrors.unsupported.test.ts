import { parseCAD } from '../cadParser';

test('unsupported format returns CAD_ERR_UNSUPPORTED_FORMAT', async () => {
  const fileLike: any = { name: 'model.unknown', arrayBuffer: async () => new ArrayBuffer(8) };
  const res = await parseCAD(fileLike);
  expect(res.error).toBeDefined();
  expect(res.error?.code).toBe('CAD_ERR_UNSUPPORTED_FORMAT');
});
