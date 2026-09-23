import path from 'path'
import { Page } from '@playwright/test'

export type InjectOptions = {
  drawing?: { glbUrl?: string; viewerUrl?: string; previewUrl?: string; volumeCm3?: number }
  pressId?: string
  materialId?: string
}

export async function serveFixture(page: Page, fixtureRelativePath: string, routePath = '/__playwright_fixture__') {
  const filePath = path.resolve(process.cwd(), fixtureRelativePath)
  await page.route(routePath, async (route) => {
    const fs = await import('fs')
    const buffer = await fs.promises.readFile(filePath)
    await route.fulfill({
      status: 200,
      body: buffer,
      headers: { 'Content-Type': 'model/gltf-binary' },
    })
  })
}

export async function injectStores(page: Page, opts: InjectOptions = {}) {
  const payload = {
    drawing: opts.drawing ?? { glbUrl: '/__playwright_fixture__', viewerUrl: '/__playwright_fixture__', previewUrl: '/__playwright_fixture__', volumeCm3: 12 },
    pressId: opts.pressId ?? null,
    materialId: opts.materialId ?? null,
  }

  await page.evaluate(async (payload) => {
    const { drawing, pressId, materialId } = payload as any

    // drawing store
    const dsMod: any = await import('/src/stores/drawingStore.ts')
    const setResult = dsMod.useDrawingStore.getState().setResult
    if (typeof setResult === 'function') setResult(drawing)

    // press store
    if (pressId) {
      const ps: any = await import('/src/stores/pressStore.ts')
      const selectPress = ps.usePressStore.getState().selectPress
      if (typeof selectPress === 'function') selectPress(pressId)
    }

    // material store
    if (materialId) {
      const ms: any = await import('/src/stores/materialStore.ts')
      const selectMaterial = ms.useMaterialStore.getState().selectMaterial
      if (typeof selectMaterial === 'function') selectMaterial(materialId)
    }
  }, payload)
}

export async function exposeStores(page: Page) {
  await page.evaluate(async () => {
    const ds: any = await import('/src/stores/drawingStore.ts')
    const ps: any = await import('/src/stores/pressStore.ts')
    const ms: any = await import('/src/stores/materialStore.ts')
    const prm: any = await import('/src/stores/parametriStore.ts')

    // @ts-expect-error - test hook
    // espone i riferimenti ai store per le utility di test
    // (getState/setState possono essere usati dalle funzioni di wait)
    // eslint-disable-next-line no-undef
    window.__FM_STORES__ = {
      drawing: ds.useDrawingStore,
      press: ps.usePressStore,
      material: ms.useMaterialStore,
      parametri: prm.useParametriStore,
    }
  })
}

export async function waitForParametriResult(page: Page, timeout = 30000) {
  await page.waitForFunction(() => {
    // eslint-disable-next-line no-undef
    const st = (window as any).__FM_STORES__
    return !!st?.parametri?.getState?.().result
  }, { timeout })
}

export default { serveFixture, injectStores }
