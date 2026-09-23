import { linearScrewSpeedToFlowCm3s } from './injectionFlow'

describe('conversione limite portata pressa', () => {
  it('usa il diametro della vite selezionata per convertire mm/s in cm³/s', () => {
    expect(linearScrewSpeedToFlowCm3s(200, 22)).toBeCloseTo(76.026542, 6)
    expect(linearScrewSpeedToFlowCm3s(200, 18)).toBeCloseTo(50.893801, 6)
  })

  it('non produce un limite inventato se manca un ingresso valido', () => {
    expect(linearScrewSpeedToFlowCm3s(undefined, 22)).toBeNull()
    expect(linearScrewSpeedToFlowCm3s(200, 0)).toBeNull()
    expect(linearScrewSpeedToFlowCm3s(-1, 22)).toBeNull()
  })
})
