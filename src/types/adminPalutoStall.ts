import type { RecipeIngredientKind, RecipePricingUnit } from "@/types/adminRecipe";

export interface AdminPalutoStall {
  id: number;
  market_id: number;
  market_name: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  contact_phone: string | null;
  status: boolean;
  is_accepting_orders: boolean;
  prep_time_minutes: number | null;
}

export interface AdminPalutoStallListPage {
  data: AdminPalutoStall[];
  current_page: number;
  last_page: number;
}

export interface AdminPalutoStallRecipeFeeIngredient {
  id: number;
  item_name: string | null;
  kind: RecipeIngredientKind;
}

export interface AdminPalutoStallRecipeFee {
  recipe_id: number;
  recipe_name: string;
  pricing_unit: RecipePricingUnit;
  offered: boolean;
  rate: string | null;
  minimum_fee: string | null;
  status: boolean;
  ingredients: AdminPalutoStallRecipeFeeIngredient[];
  provided_ingredient_ids: number[];
}
