import type { RecipeIngredientKind, RecipePricingUnit } from "@/types/adminRecipe";

export interface AdminPalutoDishSummary {
  id: number;
  paluto_stall_id: number;
  name: string;
  image_url: string | null;
  recipe_type: string | null;
  pricing_unit: RecipePricingUnit;
  base_quantity: string;
  rate: string;
  minimum_fee: string | null;
  status: boolean;
  sort_order: number;
  ingredients_count: number;
}

export interface AdminPalutoStallMenu {
  stall: {
    id: number;
    name: string;
    market_id: number;
    market_name: string | null;
    status: boolean;
  };
  dishes: AdminPalutoDishSummary[];
}

export interface AdminPalutoDishIngredient {
  id: number;
  item_id: number;
  item_name: string | null;
  kind: RecipeIngredientKind;
  /** Laravel decimal cast — always a numeric string over the wire. */
  quantity: string;
  unit_id: number;
  unit_name: string | null;
  is_optional: boolean;
  /** Supplied by the stall itself — never bought or charged to the customer. */
  is_provided: boolean;
  note: string | null;
  sort_order: number;
  /** Whether the stall's market carries this item at all. */
  in_market: boolean;
  /** Current base price at the stall's market (before markup); null if never priced there. */
  market_price: string | null;
  is_available: boolean;
}

export interface AdminPalutoDish {
  id: number;
  paluto_stall_id: number;
  stall_name: string;
  market_id: number;
  market_name: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  recipe_type_id: number | null;
  recipe_type: string | null;
  pricing_unit: RecipePricingUnit;
  base_quantity: string;
  rate: string;
  minimum_fee: string | null;
  status: boolean;
  sort_order: number;
  ingredients: AdminPalutoDishIngredient[];
}
