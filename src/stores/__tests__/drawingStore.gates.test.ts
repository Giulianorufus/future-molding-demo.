import { useDrawingStore } from '../drawingStore'

const gate = (id: string, x: number) => ({ id, position: { x, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 1 } })

describe('drawingStore injection gates', () => {
  beforeEach(() => useDrawingStore.getState().reset())

  test('add and select gate keeps legacy aliases synchronized', () => {
    useDrawingStore.getState().addGate(gate('G1', 1))

    expect(useDrawingStore.getState().gates).toHaveLength(1)
    expect(useDrawingStore.getState().selectedGateId).toBe('G1')
    expect(useDrawingStore.getState().gatePoint).toEqual({ x: 1, y: 0, z: 0 })
    expect(useDrawingStore.getState().gateNormal).toEqual({ x: 0, y: 0, z: 1 })
  })

  test('update, select and remove gate preserve deterministic selection', () => {
    useDrawingStore.getState().addGate(gate('G1', 1))
    useDrawingStore.getState().addGate(gate('G2', 2))
    useDrawingStore.getState().updateGate('G1', { position: { x: 3, y: 0, z: 0 } })
    useDrawingStore.getState().selectGate('G1')

    expect(useDrawingStore.getState().gatePoint).toEqual({ x: 3, y: 0, z: 0 })
    useDrawingStore.getState().removeGate('G1')
    expect(useDrawingStore.getState().selectedGateId).toBe('G2')
    expect(useDrawingStore.getState().gatePoint).toEqual({ x: 2, y: 0, z: 0 })
  })

  test('clearGates clears gates and legacy aliases', () => {
    useDrawingStore.getState().addGate(gate('G1', 1))
    useDrawingStore.getState().addGate(gate('G2', 2))
    useDrawingStore.getState().clearGates()

    expect(useDrawingStore.getState().gates).toEqual([])
    expect(useDrawingStore.getState().selectedGateId).toBeNull()
    expect(useDrawingStore.getState().gatePoint).toBeNull()
    expect(useDrawingStore.getState().gateNormal).toBeNull()
  })

  test('duplicate IDs and removal of a normal keep legacy aliases consistent', () => {
    const store = useDrawingStore.getState()
    store.addGate(gate('G1', 1))
    store.addGate(gate('G1', 99))
    expect(useDrawingStore.getState().gatePoint?.x).toBe(1)
    expect(useDrawingStore.getState().gates).toHaveLength(1)
    store.updateGate('G1', { normal: undefined })
    expect(useDrawingStore.getState().gateNormal).toBeNull()
    store.setResult({ gatePoint: null, gateNormal: null })
    expect(useDrawingStore.getState().gates).toEqual([])
  })
})
