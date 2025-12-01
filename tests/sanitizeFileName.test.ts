import { sanitizeFileName } from '../src/utils/sanitizeFileName';

test('sanitizeFileName removes problematic characters and preserves extension', () => {
  expect(sanitizeFileName('Frutto (1).stp')).toMatch(/^Frutto[_0-9A-Za-z]+\.stp$/);
  const out = sanitizeFileName('complex name@€#.step');
  expect(out.endsWith('.step')).toBe(true);
  // no spaces or slashes
  expect(out).not.toMatch(/[\s/\\]/);
  expect(sanitizeFileName('noext')).toBe('noext');
});
