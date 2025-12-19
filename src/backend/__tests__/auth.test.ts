import { hashPassword, verifyPassword, generateToken } from '../auth';
beforeAll(() => {
  process.env.JWT_SECRET ||= 'test-jwt-secret';
});

test('hash and verify password', async () => {
  const pw = 'test123';
  const hash = await hashPassword(pw);
  expect(await verifyPassword(pw, hash)).toBe(true);
});
test('generateToken returns string', () => {
  const token = generateToken({ id: 1, username: 'user', role: 'admin' });
  expect(typeof token).toBe('string');
});
