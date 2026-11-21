import type { PalutoDish, PalutoDishIngredient } from "@/types/paluto";

/** Mirrors PalutoDish::cookingFeeFor() — round(max(rate × quantity, minimum_fee), 2) —
 * so the preview matches the cart after adding. */
export function computeCookingFee(dish: PalutoDish, quantity: number): number {
  const rateFee = Number(dish.rate) * quantity;
  const fee =
    dish.minimum_fee !== null ? Math.max(rateFee, Number(dish.minimum_fee)) : rateFee;
  return Math.round(fee * 100) / 100;
}

/** Lines the customer actually pays for: not supplied by the stall, priced at the market
 * (optional ones without a price are skipped, same as the cart), and not unticked
 * (only optional ones can be). */
export function chargedIngredients(
  dish: PalutoDish,
  excludedIds: ReadonlySet<number> = new Set(),
): PalutoDishIngredient[] {
  return dish.ingredients.filter(
    (ingredient) =>
      !ingredient.is_provided &&
      ingredient.unit_price !== null &&
      !(ingredient.is_optional && excludedIds.has(ingredient.id)),
  );
}

/** A required ingredient the stall's market has no price for — the dish can't be ordered. */
export function hasUnavailableIngredient(dish: PalutoDish): boolean {
  return dish.ingredients.some(
    (ingredient) =>
      !ingredient.is_provided &&
      !ingredient.is_optional &&
      ingredient.unit_price === null,
  );
}

/** Optional ingredients the customer hasn't ticked: these start unticked and are left out. */
export function untickedOptionalIds(
  dish: PalutoDish,
  tickedIds: ReadonlySet<number>,
): Set<number> {
  return new Set(
    dish.ingredients
      .filter((ingredient) => ingredient.is_optional && !tickedIds.has(ingredient.id))
      .map((ingredient) => ingredient.id),
  );
}

export function estimateIngredientsCost(
  dish: PalutoDish,
  quantity: number,
  excludedIds: ReadonlySet<number> = new Set(),
): number {
  const baseQuantity = Number(dish.base_quantity);
  const scale = baseQuantity > 0 ? quantity / baseQuantity : 1;
  const total = chargedIngredients(dish, excludedIds).reduce(
    (sum, ingredient) =>
      sum + Number(ingredient.unit_price) * Number(ingredient.quantity) * scale,
    0,
  );
  return Math.round(total * 100) / 100;
}
