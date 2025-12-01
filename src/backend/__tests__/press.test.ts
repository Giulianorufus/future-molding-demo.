import { getBrands, getModels, getPressSpecs } from '../../lib/pressData';
test('getBrands returns array', () => {
  expect(Array.isArray(getBrands())).toBe(true);
});
test('getModels returns array for brand', () => {
  expect(Array.isArray(getModels('Arburg'))).toBe(true);
});
test('getPressSpecs returns specs for brand/model', () => {
  // use an existing model from sample DB
  expect(getPressSpecs('Arburg', '320C')).toBeDefined();
});
