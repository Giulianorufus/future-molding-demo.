import { test, expect } from "@playwright/test";
import { serveFixture, exposeStores, injectStores } from './helpers/fixtureHelper'

test("Flusso completo: upload → wizard → parametri → difetti", async ({ page }) => {
  // Serve the GLB fixture and set deterministic store state
  await serveFixture(page, 'tests/fixtures/Frutto (1).glb')

  await page.goto('/#/wizard')
  await expect(page.getByRole('heading', { name: 'Wizard Future Molding' })).toBeVisible()
  await exposeStores(page)
  await injectStores(page, { pressId: 'arburg-370-u', materialId: 'PP-HOMO' })

  // Navigate to Difetti and assert it rendered
  await page.goto('/#/difetti')
  await expect(page.getByRole('heading', { name: 'Difetti' })).toBeVisible({ timeout: 15000 })
})
