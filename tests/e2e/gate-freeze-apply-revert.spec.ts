import { test, expect } from '@playwright/test'

test('Gate Freeze: apply + revert', async ({ page }) => {
  // Mock policy fetch
    await page.route('**/policy/recommended_by_recipeFingerprint.json', route => {
      const body = JSON.stringify({
        generatedAt: new Date().toISOString(),
        fingerprints: {
          rfpA: {
            valid_for: { recipeFingerprint: 'rfpA', materialId: 'PP', pressId: 'AR100' },
            gateFreeze: {
              recommended_hold_s: 2.1,
              confidence: 1,
              points: 20,
              reason: 'entro_0.20%_dal_max'
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

  // Set fingerprint via cached lastCalcResult (store reads fm:lastCalcResult.meta.recipeFingerprint)
    const lastCalc = { meta: { recipeFingerprint: 'rfpA' } }
  await page.addInitScript((data) => {
    try { window.localStorage.setItem('fm:lastCalcResult', data) } catch (e) {}
  }, JSON.stringify(lastCalc))

    // Go to Parametri (hash router)
    await page.goto('/#/parametri')

  // Initial state: suggested + apply button visible
  const panel = page.getByTestId('gate-freeze-panel')
  await expect(panel).toBeVisible()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Holding consigliato')
    await expect(page.getByTestId('gate-freeze-status')).toContainText('2.1')
  await expect(page.getByTestId('gate-freeze-apply')).toBeVisible()

  // Apply
  await page.getByTestId('gate-freeze-apply').click()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Applicato')
  await expect(page.getByTestId('gate-freeze-revert')).toBeVisible()

  // Revert
  await page.getByTestId('gate-freeze-revert').click()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Holding consigliato')
})
