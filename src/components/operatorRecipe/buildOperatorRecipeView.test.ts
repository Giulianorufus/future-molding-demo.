import type { CalculationResult } from '../../core/calcEngine'
import { buildOperatorRecipeView } from './buildOperatorRecipeView'

function recipe(overrides: Partial<CalculationResult> = {}): CalculationResult {
  return {
    tonnellaggioRequired: 9.3,
    shotVolumeCm3: 19.307248,
    vpSwitchVolumeCm3: 18.874567,
    vpSwitchPercentOfShot: 97.76,
    pressureBar: 863,
    screwDiameterMm: 22,
    injectionFlowCm3s: 42,
    switchoverMs: 2970,
    times: { injectionMs: 3000, coolingMs: 20000 },
    cooling: { suggestedC: 60 },
    unified: {
      injectionProfile: [
        { step: 1, speed_cm3_s: 4.8, endBy: { kind: 'volumePercent', value: 48 } },
        { step: 2, speed_cm3_s: 20, endBy: { kind: 'volumePercent', value: 97.76 } },
      ],
      packPressione: 750,
      packTempo: 3.5,
      velocitaVite: 42,
    },
    ...overrides,
  }
}

describe('vista operatore', () => {
  it('espone la dose di riferimento e le fasi con le unità corrette', () => {
    const view = buildOperatorRecipeView(recipe())

    expect(view.shotVolumeCm3).toBe(19.307248)
    expect(view.vpVolumeCm3).toBe(18.874567)
    expect(view.injectionPhases).toEqual([
      { step: 1, flowCm3s: 4.8, endPercentOfShot: 48 },
      { step: 2, flowCm3s: 20, endPercentOfShot: 97.76 },
    ])
    expect(view.holdingPressureBar).toBe(750)
    expect(view.screwRpm).toBe(42)
  })

  it('non presenta soglie riferite alla dose quando V/P è provvisorio', () => {
    const view = buildOperatorRecipeView(recipe({
      vpSwitchVolumeCm3: null,
      vpSwitchPercentOfShot: null,
      switchoverMs: null,
    }))

    expect(view.vpVolumeCm3).toBeNull()
    expect(view.vpPercentOfShot).toBeNull()
    expect(view.vpTimeMs).toBeNull()
    expect(view.injectionPhases.every((phase) => phase.endPercentOfShot === null)).toBe(true)
  })

  it('non inventa valori per i dati assenti', () => {
    const view = buildOperatorRecipeView(recipe({ unified: null }))
    expect(view.injectionPhases).toEqual([])
    expect(view.holdingPressureBar).toBeNull()
    expect(view.screwRpm).toBeNull()
  })
})
