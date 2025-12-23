import { test, expect } from '@playwright/test';

test('shows packing suggestion from unified policy', async ({ page }) => {
  // Seed localStorage before page load with meta wrapper
  await page.addInitScript(() => {
    localStorage.setItem('fm:lastCalcResult', JSON.stringify({ meta: { recipeFingerprint: 'rfpA' } }));
  });

  // Mock the unified policy fetch (new unified path)
  await page.route('**/policy/recommended_by_recipeFingerprint.json', route => {
    const body = JSON.stringify({
      generatedAt: new Date().toISOString(),
      fingerprints: {
        rfpA: {
          valid_for: { recipeFingerprint: 'rfpA', materialId: 'PP', pressId: 'AR100' },
          packing: {
            recommended_holdingPressure_bar: 250,
            confidence: 0.4,
            points: 8,
            reason: 'within_0.2%_of_max_mean_weight_at_250bar'
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

  await page.goto('/#/parametri');

  const sel = '[data-testid="packing-suggestion"]';
  await page.waitForSelector(sel, { timeout: 10000 });
  const text = await page.locator(sel).innerText();

  expect(text).toContain('250');
  expect(text).toContain('0.4');
  expect(text).toContain('8');
});
