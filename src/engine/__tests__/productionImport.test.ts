import { parseProductionCsv } from "../productionImport/parseProductionCsv";
import { matchProductionRows } from "../productionImport/matchProductionRows";

describe("productionImport", () => {
  test("parse CSV + match by recipeId", () => {
    const csv = [
      "recipeId,producedQty,scrapQty,defects,cycleTime_s,notes",
      "smoke,100,3,bave;bolle,22.5,ok",
      "unknown,10,0,,20,",
    ].join("\n");

    const parsed = parseProductionCsv(csv);
    expect(parsed.rows).toHaveLength(2);

    const matched = matchProductionRows(parsed.rows, { knownRecipeIds: new Set(["smoke"]) });

    expect(matched[0].match).toBe("recipeId");
    expect(matched[0].producedQty).toBe(100);
    expect(matched[0].scrapQty).toBe(3);
    expect(matched[0].defects).toEqual(["bave", "bolle"]);
    expect(matched[0].cycleTime_s).toBe(22.5);

    expect(matched[1].match).toBe("unmatched");
  });
});
