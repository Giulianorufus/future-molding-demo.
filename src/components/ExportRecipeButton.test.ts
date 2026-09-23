import { buildExportRecipeSnapshot } from './ExportRecipeButton'

test('exports the canonical wizard selections and calculation result', () => {
  const snapshot = buildExportRecipeSnapshot({
    input: { volumeCm3: 4.326812, shotVolumeCm3: 19.307248 },
    output: { pressureBar: 15, screwDiameterMm: 22 },
    drawing: {
      volumeCm3: 4.326812,
      surfaceCm2: 7.04,
      boundingBox: { x: 17.6, y: 40, z: 27.9 },
      cavityCount: 4,
      feedSystem: 'cold',
      runnerVolumeCm3: 2,
      runnerProjectedAreaCm2: 1,
      conversionId: 'step-frutto',
    } as any,
    press: {
      id: 'arburg-370-u', name: 'Arburg 370 U', tonnellaggio: 600,
      shotVolumeCm3: 50, maxPressureBar: 2000, maxSpeedMmPerS: 250,
    },
    screwDiameterMm: 22,
    material: { id: 'pp', name: 'PP (Polipropilene)', densityGPerCm3: 0.905, meltIndex: 12, recommendedTemperatureC: 220 },
  })

  expect(snapshot.input).toMatchObject({
    volumeCm3: 4.326812,
    shotVolumeCm3: 19.307248,
    cad: { volumeCm3: 4.326812, projectedAreaCm2: 7.04 },
    mold: { cavityCount: 4, feedSystem: 'cold', runnerVolumeCm3: 2, runnerProjectedAreaCm2: 1 },
  })
  expect(snapshot.output).toMatchObject({ pressureBar: 15, screwDiameterMm: 22 })
  expect(snapshot.press).toMatchObject({ id: 'arburg-370-u', screwDiameter_mm: 22 })
  expect(snapshot.material).toMatchObject({ id: 'pp', factors: { densityGPerCm3: 0.905 } })
})