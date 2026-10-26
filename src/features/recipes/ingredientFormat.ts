import type { IngredientKind, PricingUnit } from "@/types/recipe";

export const INGREDIENT_KIND_LABELS: Record<IngredientKind, string> = {
  meat: "Meat",
  vegetable: "Vegetable",
  condiment: "Condiment",
  spice: "Spice",
};

/**
 * Ingredient kind implied by the item's category, used when an ingredient is
 * picked (admins can still change it). Grocery items default to condiment.
 */
export function kindFromCategory(category: string | null | undefined): IngredientKind {
  const name = (category ?? "").toLowerCase();
  if (/vegetable|fruit/.test(name)) return "vegetable";
  if (/spice|herb/.test(name)) return "spice";
  if (/grocery|condiment|sauce/.test(name)) return "condiment";
  return "meat";
}

/** Trims a scaled ingredient/quantity value to at most 2 decimals for display. */
export function formatQuantity(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/** "1 kg batch" / "Serves 2" — what a recipe's or dish's ingredient list is written for. */
export function formatBatch(pricingUnit: PricingUnit, baseQuantity: string): string {
  const qty = formatQuantity(Number(baseQuantity));
  return pricingUnit === "kg" ? `${qty} kg batch` : `Serves ${qty}`;
}

/** Customer quantity stepper settings per pricing unit. */
export function quantityStepFor(pricingUnit: PricingUnit): {
  step: number;
  min: number;
  label: string;
} {
  return pricingUnit === "kg"
    ? { step: 0.25, min: 0.25, label: "kg" }
    : { step: 1, min: 1, label: "serving(s)" };
}
