import { test, expect } from '@playwright/test';

test('shows packing suggestion from unified policy', async ({ page }) => {
  // Seed localStorage before page load
  await page.addInitScript(() => {
    localStorage.setItem('fm:lastCalcResult', JSON.stringify({ recipeFingerprint: 'rfpA' }));
  });

  // Mock the unified policy fetch
  await page.route('**/policy/recommended_by_recipeFingerprint.json', route => {
    const body = JSON.stringify({
      generatedAt: new Date().toISOString(),
      fingerprints: {
        rfpA: {
          packing: {
            recommended_holdingPressure_bar: 250,
            confidence: 0.4,
            points: 8
          }
        }
      }
    });
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body
    });
  });

  await page.goto('/parametri');

  const sel = '[data-testid="packing-suggestion"]';
  await page.waitForSelector(sel, { timeout: 5000 });
  const text = await page.locator(sel).innerText();

  expect(text).toContain('250');
  expect(text).toContain('0.4');
  expect(text).toContain('8');
});
