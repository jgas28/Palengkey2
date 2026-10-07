import type { CartItemRow } from "@/types/cart";
import type { IngredientKind, PricingUnit } from "@/types/recipe";

/** Paluto — a market stall cooks a dish from its own menu (independent of the Recipes catalog). */

export interface PalutoStallSummary {
  id: number;
  market_id: number;
  name: string;
  description: string | null;
  image: string | null;
  contact_phone: string | null;
  is_accepting_orders: boolean;
  prep_time_minutes: number | null;
  dishes_count: number;
}

export interface PalutoDishIngredient {
  id: number;
  item_id: number;
  name: string;
  image: string | null;
  kind: IngredientKind;
  /** Laravel decimal cast — always a numeric string over the wire. */
  quantity: string;
  unit: string | null;
  is_optional: boolean;
  /** The stall supplies this itself — never added to the cart or charged. */
  is_provided: boolean;
  note: string | null;
  /** Live per-unit price at the stall's market; null when the market has no price for it. */
  unit_price: string | null;
}

export interface PalutoDish {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  recipe_type: string | null;
  pricing_unit: PricingUnit;
  /** The quantity the ingredient list is written for. */
  base_quantity: string;
  /** Cooking fee — ₱ per unit of pricing_unit, floored at minimum_fee. */
  rate: string;
  minimum_fee: string | null;
  ingredients: PalutoDishIngredient[];
}

export interface PalutoStallMenu extends Omit<PalutoStallSummary, "dishes_count"> {
  dishes: PalutoDish[];
}

/** Mirrors `cart_recipe_bundles` — a Buy Raw recipe or a stall-cooked dish, plus its ingredient lines. */
export interface CartRecipeBundle {
  id: number;
  recipe_id: number | null;
  paluto_dish_id: number | null;
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

export interface AddPalutoDishToCartPayload {
  paluto_dish_id: number;
  quantity: number;
}
