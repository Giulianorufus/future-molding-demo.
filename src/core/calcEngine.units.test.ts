import { calcolaParametri as calculateUnified } from '../engine/calcEngine'
import { calcolaParametri } from './calcEngine'

jest.mock('../engine/calcEngine', () => ({
  calcolaParametri: jest.fn(() => ({
    tonnellaggio: 9.3,
    shotVolumeCm3: 19.307248,
    velIniezione: 50,
    fillTime: 0.2,
    coolingTime: 20,
  })),
}))

describe('adattatore delle unità pressa', () => {
  it('passa il limite in cm³/s usando la vite selezionata', () => {
    jest.clearAllMocks()

    const result = calcolaParametri({
      volumeCm3: 4.326812,
      press: {
        id: 'arburg-370-u',
        tonnellaggio: 370,
        screwDiameters: [18, 22, 25],
        screwDiameterMm: 22,
        maxPressureBar: 250,
        maxSpeedMmPerS: 200,
      },
    })
    const unifiedInput = jest.mocked(calculateUnified).mock.calls[0]?.[0] as unknown as {
      machine: { maxInjectionSpeed_cm3_s: number }
    }

    expect(unifiedInput.machine.maxInjectionSpeed_cm3_s).toBeCloseTo(76.026542, 6)
    expect(result.shotVolumeCm3).toBe(19.307248)
  })
})
