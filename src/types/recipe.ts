import type { ItemAvailability } from "@/types/item";
/** The Recipes catalog — cook-it-yourself guides whose ingredients can be bought raw. */

export type PricingUnit = "kg" | "serving";
export type IngredientKind = "meat" | "vegetable" | "condiment" | "spice";

export interface RecipeType {
  id: number;
  name: string;
}

export interface RecipeSummary {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  recipe_type: string | null;
  pricing_unit: PricingUnit;
  /** Laravel decimal cast — always a numeric string over the wire, e.g. "1.000". */
  base_quantity: string;
}

export interface RecipeIngredient {
  id: number;
  item_id: number;
  name: string;
  image: string | null;
  kind: IngredientKind;
  /** Laravel decimal cast — always a numeric string over the wire. */
  quantity: string;
  unit: string | null;
  is_optional: boolean;
  note: string | null;
  /** Per-unit price at the requested market; null when that market has no price for it. */
  unit_price: string | null;
  /** Live status at the requested market (same rules as the shop). */
  sold_here?: boolean;
  availability?: ItemAvailability;
  available_on?: string | null;
  /** Past today's cutoff at that market — shows "Order later". */
  is_cutoff?: boolean;
}

export interface RecipeDetail {
  id: number;
  name: string;
  description: string | null;
  steps: string[];
  tips: string | null;
  image: string | null;
  recipe_type: string | null;
  pricing_unit: PricingUnit;
  base_quantity: string;
  /** The market the ingredient prices are for. */
  market_id: number | null;
  ingredients: RecipeIngredient[];
}

export interface AddRecipeToCartPayload {
  recipe_id: number;
  market_id: number;
  quantity: number;
  /** Ingredients the customer unchecked. */
  excluded_ingredient_ids?: number[];
}
