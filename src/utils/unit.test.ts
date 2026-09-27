import { describe, expect, it } from "vitest";
import { isWeightUnit } from "./unit";

describe("isWeightUnit", () => {
  it.each(["kg", "Kg", "kilogram", "g", "gram", "grams"])(
    "returns true for %s",
    (unit) => {
      expect(isWeightUnit(unit)).toBe(true);
    },
  );

  it.each(["pcs", "pack", "bundle", null])("returns false for %s", (unit) => {
    expect(isWeightUnit(unit)).toBe(false);
  });
});
