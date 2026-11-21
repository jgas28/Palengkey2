import { describe, expect, it } from "vitest";
import { estimateIngredientsCost, untickedOptionalIds } from "./palutoPricing";
import type { PalutoDish, PalutoDishIngredient } from "@/types/paluto";

const ingredient = (over: Partial<PalutoDishIngredient>): PalutoDishIngredient =>
  ({
    id: 1,
    name: "Hipon",
    quantity: 1,
    unit: "kg",
    unit_price: "100",
    is_optional: false,
    is_provided: false,
    kind: "main",
    note: null,
    ...over,
  }) as PalutoDishIngredient;

const dish = {
  base_quantity: 1,
  ingredients: [
    ingredient({ id: 1, unit_price: "300" }),
    ingredient({ id: 2, name: "Sili", unit_price: "20", is_optional: true }),
    ingredient({ id: 3, name: "Kangkong", unit_price: "40" }),
  ],
} as unknown as PalutoDish;

describe("estimateIngredientsCost", () => {
  it("counts every ingredient by default", () => {
    expect(estimateIngredientsCost(dish, 1)).toBe(360);
  });

  it("leaves out unticked optional ingredients", () => {
    expect(estimateIngredientsCost(dish, 1, new Set([2]))).toBe(340);
    expect(estimateIngredientsCost(dish, 2, new Set([2]))).toBe(680);
  });

  it("never leaves out a required ingredient", () => {
    expect(estimateIngredientsCost(dish, 1, new Set([1, 3]))).toBe(360);
  });
});

describe("untickedOptionalIds", () => {
  it("leaves every optional ingredient out until it's ticked", () => {
    const none = untickedOptionalIds(dish, new Set());
    expect([...none]).toEqual([2]);
    expect(estimateIngredientsCost(dish, 1, none)).toBe(340);

    const ticked = untickedOptionalIds(dish, new Set([2]));
    expect(ticked.size).toBe(0);
    expect(estimateIngredientsCost(dish, 1, ticked)).toBe(360);
  });
});
