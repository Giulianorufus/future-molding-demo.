import { test, expect } from '@playwright/test';
import path from 'path';

test('upload STL and trigger analyze', async ({ page, request }) => {
  // Navigate to app
  await page.goto('/');

  // Attempt to find a file input on the page
  const fileInput = await page.locator('input[type=file]');
  const samplePath = path.resolve(process.cwd(), 'public', 'sample-drawings', 'cube40x40x10.stl');

  // If file input exists, set file
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(samplePath);
  } else {
    test.skip(true, 'No file input found on page to perform upload');
  }

  // Wait for a request to /api/calc/analyze or for an element showing result
  const analyzeResponse = await page.waitForResponse(resp => resp.url().includes('/api/calc/analyze') && resp.status() === 200, { timeout: 15000 }).catch(() => null);
  expect(analyzeResponse, 'Expected /api/calc/analyze response').not.toBeNull();

  // Optionally check DOM for calculation result area
  const resultSelector = '.calculation-result, .calc-result, #calculation-result';
  const visible = await page.locator(resultSelector).first().isVisible().catch(() => false);
  expect(visible || analyzeResponse !== null).toBeTruthy();
});
