import { useParametriStore } from '../../stores/parametriStore'
import { KnowledgeRecorder } from '../knowledgeRecorder'
import * as knowledgeService from '../knowledgeService'

describe('KnowledgeRecorder', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    useParametriStore.setState({
      lastInput: null,
      lastCalcResult: null,
      result: null,
      lastDefectFix: null,
    } as any)
  })

  test('starts a session and records a case and an experiment on first calculation', async () => {
    const saveCaseSpy = jest.spyOn(knowledgeService, 'saveKnowledgeCase').mockResolvedValue({})
    const saveExperimentSpy = jest.spyOn(knowledgeService, 'saveKnowledgeExperiment').mockResolvedValue({})
    const recorder = new KnowledgeRecorder({ operatorId: 'op-1', operatorName: 'Operator 1' })

    recorder.start()

    useParametriStore.setState({
      lastInput: { parameters: { speed: 60 } },
      lastCalcResult: { meta: { recipeFingerprint: 'rfp-1', geometryHash: 'gh-1' }, cycleTimeMs: 120 },
      result: { meta: { recipeFingerprint: 'rfp-1', geometryHash: 'gh-1' }, cycleTimeMs: 120 },
      lastDefectFix: null,
    } as any)

    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(saveCaseSpy).toHaveBeenCalledTimes(1)
    expect(saveExperimentSpy).toHaveBeenCalledTimes(1)

    recorder.stop()
  })

  test('records an experiment when a defect fix occurs', async () => {
    const saveCaseSpy = jest.spyOn(knowledgeService, 'saveKnowledgeCase').mockResolvedValue({})
    const saveExperimentSpy = jest.spyOn(knowledgeService, 'saveKnowledgeExperiment').mockResolvedValue({})
    const recorder = new KnowledgeRecorder()

    recorder.start()

    useParametriStore.setState({
      lastInput: { parameters: { speed: 60 } },
      lastCalcResult: { meta: { recipeFingerprint: 'rfp-2' }, cycleTimeMs: 135 },
      result: { meta: { recipeFingerprint: 'rfp-2' }, cycleTimeMs: 135 },
      lastDefectFix: null,
    } as any)

    await new Promise((resolve) => setTimeout(resolve, 20))

    useParametriStore.setState({
      lastDefectFix: { defectId: 'sink-mark', severity: 'high', notes: [] },
    } as any)

    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(saveCaseSpy).toHaveBeenCalledTimes(1)
    expect(saveExperimentSpy).toHaveBeenCalledTimes(2)

    recorder.stop()
  })
})
