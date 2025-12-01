import { parseOverride } from "../utils/overrides";

describe("parseOverride", () => {
  test("parses percent", () => {
    expect(parseOverride("+20%")).toEqual({ type: 'percent', val: 20 });
    expect(parseOverride("-5%")).toEqual({ type: 'percent', val: -5 });
  });

  test("parses add numbers and seconds", () => {
    expect(parseOverride("+10")).toEqual({ type: 'add', val: 10 });
    expect(parseOverride("+30s")).toEqual({ type: 'add', val: 30 });
    expect(parseOverride("+5°C")).toEqual({ type: 'add', val: 5 });
  });

  test("parses numeric input", () => {
    expect(parseOverride(42)).toEqual({ type: 'absolute', val: 42 });
  });
});
