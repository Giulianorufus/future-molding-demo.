import { render, screen, within } from '@testing-library/react'
import OperatorRecipePanel from '../OperatorRecipePanel'
import type { CalculationResult } from '../../core/calcEngine'

const result: CalculationResult = {
  tonnellaggioRequired: 12,
  shotVolumeCm3: 35,
  vpSwitchVolumeCm3: 27,
  vpSwitchPercentOfShot: 77.14,
  pressureBar: 850,
  screwDiameterMm: 30,
  velocityMmPerS: 20,
  switchoverMs: 3000,
  times: { injectionMs: 3000, coolingMs: 20000 },
  cooling: { suggestedC: 40 },
  unified: {
    velIniezione: 20,
    injectionProfile: [{ step: 1, speed_cm3_s: 4.8, endBy: { kind: 'volumePercent', value: 15 } }],
    packingProfile: [{ step: 1, pressure_bar: 750, time_s: 1 }],
    coolingTime: 20,
  },
}

test('reads the stages in operator order and keeps injected V/P distinct from machine residual volume', () => {
  render(<OperatorRecipePanel result={result} />)
  expect(screen.getByText('27 cm³')).toBeInTheDocument()
  expect(screen.getByText(/non è un’impostazione da copiare/)).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Iniezione e commutazione' })).getByText('4,8 cm³/s')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Postpressione' })).getByText('750 bar')).toBeInTheDocument()
  expect(screen.getByText(/Decompressione: nessun valore calcolato/)).toBeInTheDocument()
})

test('missing V/P geometry is shown as unavailable instead of zero', () => {
  render(<OperatorRecipePanel result={{ ...result, vpSwitchVolumeCm3: null, vpSwitchPercentOfShot: null }} />)
  expect(within(screen.getByRole('region', { name: 'Iniezione e commutazione' })).getByText('— cm³')).toBeInTheDocument()
})
