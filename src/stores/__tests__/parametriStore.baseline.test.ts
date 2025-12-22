import { useParametriStore } from '../parametriStore'
import { usePressStore } from '../pressStore'
import { useMaterialStore } from '../materialStore'

describe('parametriStore applyBaselineFromCase', () => {
  beforeEach(() => {
    // reset stores
    ;(useParametriStore as any).setState({ baselineCaseId: undefined, baselineSnapshot: undefined })
    ;(usePressStore as any).setState({ selectedPressId: null })
    ;(useMaterialStore as any).setState({ selectedMaterialId: null })
  })

  test('applies baseline case ids and updates press/material selection', () => {
    const fakeCase: any = {
      id: 'case-123',
      materialId: 'MAT-1',
      pressId: 'PRESS-1',
      recipeSnapshot: { meta: { timestampISO: new Date().toISOString(), appVersion: 'test', pressCatalogVersion: 'v', materialsVersion: 'v' } },
    }

    useParametriStore.getState().applyBaselineFromCase(fakeCase)

    const s = useParametriStore.getState()
    expect(s.baselineCaseId).toBe('case-123')
    expect(s.baselineSnapshot).toBeDefined()

    const p = usePressStore.getState()
    const m = useMaterialStore.getState()
    expect(p.selectedPressId).toBe('PRESS-1')
    expect(m.selectedMaterialId).toBe('MAT-1')
  })
})
