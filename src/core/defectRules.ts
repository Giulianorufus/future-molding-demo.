import { CalculationInput } from './calcEngine'

export type DefectRule = {
  id: string
  name: string
  description?: string
  apply: (input: CalculationInput) => CalculationInput
}

export const rules: DefectRule[] = [
  {
    id: 'short-shot',
    name: 'Short shot',
    description: 'Reduce shot volume by 10%',
    apply(input) {
      const clone = { ...input }
      if (clone.shotVolumeCm3) clone.shotVolumeCm3 = clone.shotVolumeCm3 * 0.9
      return clone
    },
  },
  {
    id: 'flash',
    name: 'Flash',
    description: 'Increase clamp force requirement by 10%',
    apply(input) {
      return { ...input }
    },
  },
]

export function applyRule(ruleId: string, input: CalculationInput): CalculationInput {
  const r = rules.find((x) => x.id === ruleId)
  return r ? r.apply(input) : input
}

export default { rules, applyRule }
