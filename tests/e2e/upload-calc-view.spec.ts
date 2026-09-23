import { test, expect } from '@playwright/test';
import { serveFixture, exposeStores, injectStores } from './helpers/fixtureHelper'

test('upload → analisi CAD → viewer visibile (via store injection)', async ({ page }) => {
  // Instead of performing a real upload, serve the GLB fixture and inject stores so the viewer mounts.
  await serveFixture(page, 'tests/fixtures/Frutto (1).glb')
  await page.goto('/#/wizard')
  await exposeStores(page)
  await injectStores(page, { drawing: { glbUrl: '/__playwright_fixture__', viewerUrl: '/__playwright_fixture__', previewUrl: '/__playwright_fixture__', volumeCm3: 12 }, pressId: 'arburg-370-u', materialId: 'PP-HOMO' })

  // Viewer canvas is on the Difetti page
  await page.goto('/#/difetti')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
})
