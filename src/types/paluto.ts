import type { CartItemRow } from "@/types/cart";

export type PricingUnit = "kg" | "serving";
export type RecipeIngredientKind = "meat" | "vegetable" | "condiment" | "spice";

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
  kind: RecipeIngredientKind;
  /** Laravel decimal cast — always a numeric string over the wire. */
  quantity: string;
  unit: string | null;
  is_optional: boolean;
  note: string | null;
}

/**
 * A stall as returned inside a recipe-detail response: `rate`/`minimum_fee` are the
 * stall's per-recipe cooking fee (₱ per unit of the recipe's `pricing_unit`), only
 * meaningful in that context — mirrors `paluto_stall_recipes` on the backend.
 */
export interface PalutoStall {
  id: number;
  name: string;
  market_id: number;
  description: string | null;
  image: string | null;
  contact_phone: string | null;
  is_accepting_orders: boolean;
  prep_time_minutes: number | null;
  /** Laravel decimal casts — always numeric strings over the wire. */
  rate: string;
  minimum_fee: string | null;
  /** recipe_ingredients.id values this stall already includes for this recipe
   * (spices/condiments/garnish, etc.) — skipped from the cart when this stall
   * is chosen, since the customer isn't buying them separately. */
  provided_ingredient_ids: number[];
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
  ingredients: RecipeIngredient[];
  /** Stalls in the requested market that offer this recipe, active + accepting orders. */
  stalls: PalutoStall[];
}

/** Mirrors `cart_recipe_bundles` — a recipe + its ingredient CartItemRows + chosen stall. */
export interface CartRecipeBundle {
  id: number;
  recipe_id: number | null;
  recipe_name: string;
  image: string | null;
  /** Laravel decimal cast — always a numeric string over the wire. */
  quantity: string;
  pricing_unit: PricingUnit;
  paluto_stall_id: number | null;
  stall_name: string | null;
  rate_at_purchase: string;
  cooking_fee: string;
  ingredients: CartItemRow[];
  subtotal: string;
}

export interface AddRecipeToCartPayload {
  recipe_id: number;
  market_id: number;
  quantity: number;
  paluto_stall_id?: number;
  /** Buy Raw only — ignored server-side when paluto_stall_id is set. */
  excluded_ingredient_ids?: number[];
}
