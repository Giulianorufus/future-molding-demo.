// This test needs to ensure the parametriStore client-side orchestration initializer runs.
// The initializer is guarded by `typeof window !== 'undefined'`, so we create a fake `window`
// in the Node test env before importing the stores.
describe('parametriStore orchestration (integration-like unit test)', () => {
  beforeEach(() => {
    // ensure global window exists so the parametriStore orchestration initializes
    // Jest runs with testEnvironment=node by default in this project
    // so we add a minimal window object.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof global.window === 'undefined') global.window = {}

    // import stores after ensuring window exists
    // mock the JSON imports used by pressStore to avoid TypeScript JSON loader issues in ts-jest
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.mock('@/data/pressCatalog/arburg.json', () => ({ id: 'arburg-370-u', name: 'Arburg 370 U', tonnellaggio: 370, screwDiameters: [18,22], shotVolumeCm3: 100, maxPressureBar: 200, maxSpeedMmPerS: 300 }), { virtual: true })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.mock('@/data/pressCatalog/engel.json', () => ({}), { virtual: true })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.mock('@/data/pressCatalog/toyo.json', () => ({}), { virtual: true })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.mock('@/data/pressCatalog/bmb.json', () => ({}), { virtual: true })

    // use require to control import order
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const drawing = require('../src/stores/drawingStore') as typeof import('../src/stores/drawingStore')
    const press = require('../src/stores/pressStore') as typeof import('../src/stores/pressStore')
    const material = require('../src/stores/materialStore') as typeof import('../src/stores/materialStore')
    const param = require('../src/stores/parametriStore') as typeof import('../src/stores/parametriStore')

    // reset stores to known state using available APIs
    drawing.useDrawingStore.getState().reset?.()
    // press store: deselect
    press.usePressStore.getState().selectPress?.(null)
    press.usePressStore.getState().selectScrewDiameter?.(null)
    // material store: clear catalog + deselect
    material.useMaterialStore.getState().setCatalog?.({})
    material.useMaterialStore.getState().selectMaterial?.(null)
    // param store reset
    param.useParametriStore.getState().reset?.()
  })

  test('calculates params when drawing+press+material are set', async () => {
    const drawing = require('../src/stores/drawingStore')
    const press = require('../src/stores/pressStore')
    const material = require('../src/stores/materialStore')
    const param = require('../src/stores/parametriStore')

    // set a drawing volume
    drawing.useDrawingStore.getState().setResult?.({ volumeCm3: 10 })

    // set a minimal press catalog and select
    const samplePress = {
      id: 'testpress',
      name: 'Test Press',
      tonnellaggio: 100,
      screwDiameters: [20],
      shotVolumeCm3: 50,
      maxPressureBar: 200,
      maxSpeedMmPerS: 300,
    }
    press.usePressStore.getState().setCatalog?.({ [samplePress.id]: samplePress })
    press.usePressStore.getState().selectPress?.(samplePress.id)
    press.usePressStore.getState().selectScrewDiameter?.(20)

    // set a minimal material and select
    const sampleMat = {
      id: 'TEST_MAT',
      name: 'Test Material',
      densityGPerCm3: 1.0,
      meltIndex: null,
      recommendedTemperatureC: 60,
    }
    material.useMaterialStore.getState().setCatalog?.({ [sampleMat.id]: sampleMat })
    material.useMaterialStore.getState().selectMaterial?.(sampleMat.id)

    // wait for debounce + calculation (debounce is 250ms in store)
    await new Promise((r) => setTimeout(r, 600))

    const res = param.useParametriStore.getState().result
    expect(res).not.toBeNull()
    expect(res?.tonnellaggioRequired).toBeGreaterThanOrEqual(1)
  })
})
