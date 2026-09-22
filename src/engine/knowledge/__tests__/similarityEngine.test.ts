import SimilarityEngine, { defaultWeights } from '../similarityEngine'

import type { KnowledgeCaseRecord } from '../types'

describe('SimilarityEngine', () => {
  const engine = new SimilarityEngine()

  test('identical cases score high', () => {
    const a: KnowledgeCaseRecord = {
      id: 'c1',
      createdAtISO: new Date().toISOString(),
      machineId: 'press1',
      materialId: 'matA',
      geometryHash: 'gh1',
      thicknessMm: 2.5,
      metadata: { shotWeight_g: 50, meltTempC: 240 },
    } as any

    const probe = { ...a }
    const s = engine.scoreCase(a, probe)
    expect(s.total).toBeGreaterThanOrEqual(90)
  })

  test('completely different cases score low', () => {
    const a: KnowledgeCaseRecord = {
      id: 'c2',
      createdAtISO: new Date().toISOString(),
      machineId: 'press1',
      materialId: 'matA',
      geometryHash: 'gh1',
      thicknessMm: 2.5,
      metadata: { shotWeight_g: 50, meltTempC: 240 },
    } as any

    const probe = {
      id: 'p1',
      createdAtISO: new Date().toISOString(),
      machineId: 'press2',
      materialId: 'matB',
      geometryHash: 'ghX',
      thicknessMm: 5.0,
      metadata: { shotWeight_g: 120, meltTempC: 180 },
    } as any

    const s = engine.scoreCase(a, probe)
    expect(s.total).toBeLessThan(40)
  })

  test('similar cases reflect contributions', () => {
    const a: KnowledgeCaseRecord = {
      id: 'c3',
      createdAtISO: new Date().toISOString(),
      machineId: 'press1',
      materialId: 'matA',
      geometryHash: 'gh1',
      thicknessMm: 2.5,
      metadata: { shotWeight_g: 50, meltTempC: 240, screwId: 's1' },
    } as any

    const probe: Partial<KnowledgeCaseRecord> = {
      machineId: 'press1',
      materialId: 'matA',
      geometryHash: 'gh1',
      thicknessMm: 2.6,
      metadata: { shotWeight_g: 52, meltTempC: 238, screwId: 's1' },
    } as any

    const s = engine.scoreCase(a, probe)
    expect(s.contributions.material).toBe(1)
    expect(s.contributions.geometry).toBe(1)
    expect(s.contributions.press).toBe(1)
    expect(s.total).toBeGreaterThan(80)
  })
})
