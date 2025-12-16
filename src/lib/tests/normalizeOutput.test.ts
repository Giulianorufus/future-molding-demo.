import { normalizeCorrections, normalizeStringArray } from '../normalizeOutput'

describe("normalizeOutput", () => {
  it("dedupes and sorts string arrays", () => {
    const out = normalizeStringArray([" b ", "a", "a", "", "B"])
    const sorted = [...out].sort((x, y) => x.localeCompare(y))
    expect(out).toEqual(sorted)
  })

  it("dedupes corrections by id and orders deterministically", () => {
    const out = normalizeCorrections([
      { id: "pressLimit:injectionSpeed_cm3_s", type: "pressLimit", target: "injectionSpeed_cm3_s", action: "clamp", after: 120 },
      { id: "pressLimit:injectionSpeed_cm3_s", type: "pressLimit", target: "injectionSpeed_cm3_s", action: "clamp", after: 110 }, // dup -> last wins
      { id: "clampMitigation:packingPressure_bar", type: "clampMitigation", target: "packingPressure_bar", action: "decrease", delta: -10 },
      { id: "clampMitigation:packingPressure_bar", type: "clampMitigation", target: "packingPressure_bar", action: "decrease", delta: -20 }, // dup -> last wins
    ])

    expect(out.length).toBe(2)

    const speed2 = out.find((c: any) => c.id === "pressLimit:injectionSpeed_cm3_s")
    expect(speed2?.after).toBe(110)

    const pack = out.find((c: any) => c.id === "clampMitigation:packingPressure_bar")
    expect(pack?.delta).toBe(-20)

    const keys = out.map(c => c.id.toLowerCase()).sort((a, b) => a.localeCompare(b))
    expect(out.map(c => c.id.toLowerCase())).toEqual(keys)
  })
})
