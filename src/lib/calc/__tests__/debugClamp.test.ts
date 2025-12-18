import { calculateParameters } from '@/engine/calcEngine'

test('debug clamp output', () => {
  const input: any = {
    machine: {
      id: 'arburg-50t',
      tonnellaggio_kN: 500,
      screwDiameter_mm: 20,
      maxInjectionSpeed_cm3_s: 10,
      maxInjectionPressure_bar: 100,
      maxShotVolume_cm3: 200,
    },
    material: { id: 'pc' },
    geometry: { volumePezzo_cm3: 30, areaProiettata_cm2: 10 },
    options: { debug: false },
  }

  const out: any = calculateParameters(input)
  // print debug info
  // eslint-disable-next-line no-console
  console.log('DEBUG sugerimenti:', out.suggerimenti)
  // eslint-disable-next-line no-console
  console.log('DEBUG suggestions:', out.suggestions)
  // eslint-disable-next-line no-console
  console.log('DEBUG warnings:', out.warnings)
  // eslint-disable-next-line no-console
  console.log('DEBUG injectionSpeedCm3s:', out.injectionSpeedCm3s, 'velIniezione:', out.velIniezione)
  expect(out).toBeDefined()
})
