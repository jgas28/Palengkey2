export type RecipePricingUnit = "kg" | "serving";
export type RecipeIngredientKind = "meat" | "vegetable" | "condiment" | "spice";

export interface AdminRecipeIngredient {
  id: number;
  item_id: number;
  item_name: string;
  kind: RecipeIngredientKind;
  quantity: string;
  unit_id: number;
  unit_name: string | null;
  is_optional: boolean;
  note: string | null;
  sort_order: number;
}

export interface AdminRecipe {
  id: number;
  name: string;
  description: string | null;
  steps: string[];
  tips: string | null;
  image_url: string | null;
  recipe_type_id: number | null;
  recipe_type: string | null;
  pricing_unit: RecipePricingUnit;
  base_quantity: string;
  status: boolean;
  ingredients: AdminRecipeIngredient[];
}

export interface AdminRecipeListItem {
  id: number;
  name: string;
  image_url: string | null;
  recipe_type: string | null;
  pricing_unit: RecipePricingUnit;
  base_quantity: string;
  status: boolean;
}

export interface AdminRecipeListPage {
  data: AdminRecipeListItem[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}
