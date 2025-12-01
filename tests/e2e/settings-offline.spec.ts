import { test, expect } from '@playwright/test';

test('impostazioni → toggle AI cloud', async ({ page }) => {
  await page.goto('/#/impostazioni');

  // Find button that contains text 'AI Cloud' or 'AI Cloud:'. Use fallback search
  const toggle = page.locator('button', { hasText: 'AI Cloud' }).first();
  await expect(toggle).toBeVisible();

  const labelBefore = await toggle.textContent();
  await toggle.click();
  const labelAfter = await toggle.textContent();

  expect(labelBefore).not.toEqual(labelAfter);
});
