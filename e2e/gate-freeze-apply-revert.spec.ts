import { test, expect } from '@playwright/test'

test('Gate Freeze: apply + revert', async ({ page }) => {
  // 1) Mock policy fetch
  await page.route('**/gate-freeze/recommended_by_recipeFingerprint.json', async (route) => {
    const body = JSON.stringify({
      generatedAt: new Date().toISOString(),
      fingerprints: {
        rfpA: {
          recommended_hold_s: 2.1,
          confidence: 1,
          valid_for: { recipeFingerprint: 'rfpA', materialId: 'PP', pressId: 'AR100' },
          points: 20,
          reason: 'entro_0.20%_dal_max',
        },
      },
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body })
  })

  // 2) Set fingerprint via cached lastCalcResult (store reads fm:lastCalcResult.meta.recipeFingerprint)
  const lastCalc = {
    meta: { recipeFingerprint: 'rfpA' },
    output: {},
  }
  await page.addInitScript((data) => {
    try { window.localStorage.setItem('fm:lastCalcResult', data) } catch (e) {}
  }, JSON.stringify(lastCalc))

  // 3) Go to Parametri
  await page.goto('/parametri')

  // 4) Initial state: suggested + apply button visible
  const panel = page.getByTestId('gate-freeze-panel')
  await expect(panel).toBeVisible()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Holding consigliato')
  await expect(page.getByTestId('gate-freeze-apply')).toBeVisible()

  // 5) Apply
  await page.getByTestId('gate-freeze-apply').click()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Applicato')
  await expect(page.getByTestId('gate-freeze-revert')).toBeVisible()

  // 6) Revert
  await page.getByTestId('gate-freeze-revert').click()
  await expect(page.getByTestId('gate-freeze-status')).toContainText('Holding consigliato')
})
