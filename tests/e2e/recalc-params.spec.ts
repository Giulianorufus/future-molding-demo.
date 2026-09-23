import { test, expect } from '@playwright/test';
import { serveFixture, exposeStores, injectStores, waitForParametriResult } from './helpers/fixtureHelper'

test('selezione pressa/materiale/vite → calcolo parametri', async ({ page }) => {
  // Serve fixture and prepare stores
  await serveFixture(page, 'tests/fixtures/Frutto (1).glb')
  await page.goto('/#/wizard')
  await exposeStores(page)

  await injectStores(page, { pressId: 'arburg-370-u', materialId: 'PP-HOMO' })

  // Wait for parametriStore.result to be available (or timeout)
  await waitForParametriResult(page, 15000)

  // Verify Parametri page shows the results
  await page.goto('/#/parametri')
  await expect(page.getByRole('heading', { name: 'Sintesi calcolo' })).toBeVisible()
  await expect(page.getByText('Chiusura richiesta')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ricetta iniziale operatore' })).toBeVisible()
})
