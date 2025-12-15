import { test, expect } from '@playwright/test'
import { serveFixture, exposeStores, injectStores, waitForParametriResult } from './helpers/fixtureHelper'

test('Difetti: cambio severità aggiorna lastDefectFix.severity', async ({ page }) => {
  await serveFixture(page, 'tests/fixtures/Frutto (1).glb')

  await page.goto('/#/wizard')
  await exposeStores(page)

  await injectStores(page, {
    drawing: { glbUrl: '/__playwright_fixture__', previewUrl: '/__playwright_fixture__', volumeCm3: 12 },
    pressId: 'arburg-370-u',
    materialId: 'PP-HOMO',
  })

  await waitForParametriResult(page)

  await page.goto('/#/difetti')

    // Imposta direttamente lo stato difetto+severità nello store (più deterministico)
    await page.evaluate(async () => {
      const ds: any = await import('/src/stores/defectsStore.ts')
      ds.useDefectsStore.getState().setSelectedDefectId('short-shot')
      ds.useDefectsStore.getState().setSelectedSeverity('medium')
    })

  // aspetta che il parametriStore esponga la correzione applicata (default medium)
  await page.waitForFunction(() => {
    // eslint-disable-next-line no-undef
    const st = (window as any).__FM_STORES__
    const f = st?.parametri?.getState?.().lastDefectFix
    return !!f && f.severity === 'medium'
  }, { timeout: 5000 })

    // cambia severità via store a 'high'
    await page.evaluate(async () => {
      const ds: any = await import('/src/stores/defectsStore.ts')
      ds.useDefectsStore.getState().setSelectedSeverity('high')
    })

  // verifica che il store rifletta la nuova severity
  await page.waitForFunction(() => {
    // eslint-disable-next-line no-undef
    const st = (window as any).__FM_STORES__
    const f = st?.parametri?.getState?.().lastDefectFix
    return !!f && f.severity === 'high'
  }, { timeout: 5000 })
})
