import { test, expect } from '@playwright/test';

test('upload → analisi CAD → viewer visibile', async ({ page }) => {
  // Go to the Parametri page where upload is available
  await page.goto('/#/parametri');

  // find first file input and upload a small STL fixture (input may be hidden)
  const fileInput = page.locator('input[type="file"]').first();
  const filePath = 'tests/fixtures/sample-part.stl';
  await fileInput.setInputFiles(filePath);

  // wait for either an analysis summary or an inline thumbnail image (data URL) to appear
  let found = false;
  try {
    await page.waitForSelector('img[src^="data:"]', { timeout: 45000 });
    found = true;
  } catch (e) {
    // fallback to waiting for analysis text
  }
  if (!found) {
    await page.waitForSelector('text=/Analisi disegno:/', { timeout: 15000 });
  }

  // first select on the page (drawings select) should be enabled
  const firstSelect = page.locator('select').first();
  await expect(firstSelect).toBeEnabled();
});
