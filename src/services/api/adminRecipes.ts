import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminRecipe,
  AdminRecipeIngredient,
  AdminRecipeListPage,
  RecipeIngredientKind,
  RecipePricingUnit,
} from "@/types/adminRecipe";

export interface ListAdminRecipesParams {
  search?: string;
  recipeTypeId?: number;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminRecipes(
  params: ListAdminRecipesParams = {},
): Promise<AdminRecipeListPage> {
  const { data } = await adminApiClient.get<AdminRecipeListPage>("/admin/recipes", {
    params: {
      search: params.search || undefined,
      recipe_type_id: params.recipeTypeId,
      status: params.status,
      page: params.page,
    },
  });
  return data;
}

export async function getAdminRecipe(recipeId: number): Promise<AdminRecipe> {
  const { data } = await adminApiClient.get<AdminRecipe>(`/admin/recipes/${recipeId}`);
  return data;
}

export interface RecipeFormPayload {
  name: string;
  description?: string;
  steps?: string[];
  tips?: string;
  recipe_type_id?: number;
  pricing_unit: RecipePricingUnit;
  base_quantity: number;
  image?: File;
}

function toRecipeFormData(payload: Partial<RecipeFormPayload>): FormData {
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.description) form.append("description", payload.description);
  if (payload.steps) {
    payload.steps.forEach((step, index) => form.append(`steps[${index}]`, step));
  }
  if (payload.tips) form.append("tips", payload.tips);
  if (payload.recipe_type_id !== undefined) {
    form.append("recipe_type_id", String(payload.recipe_type_id));
  }
  if (payload.pricing_unit !== undefined) {
    form.append("pricing_unit", payload.pricing_unit);
  }
  if (payload.base_quantity !== undefined) {
    form.append("base_quantity", String(payload.base_quantity));
  }
  if (payload.image) form.append("image", payload.image);
  return form;
}

export async function createAdminRecipe(
  payload: RecipeFormPayload,
): Promise<AdminRecipe> {
  const { data } = await adminApiClient.post<AdminRecipe>(
    "/admin/recipes",
    toRecipeFormData(payload),
  );
  return data;
}

export async function updateAdminRecipe(
  recipeId: number,
  payload: Partial<RecipeFormPayload>,
): Promise<AdminRecipe> {
  const { data } = await adminApiClient.post<AdminRecipe>(
    `/admin/recipes/${recipeId}`,
    toRecipeFormData(payload),
  );
  return data;
}

export async function deactivateAdminRecipe(
  recipeId: number,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.delete<{ message: string }>(
    `/admin/recipes/${recipeId}`,
  );
  return data;
}

export async function restoreAdminRecipe(recipeId: number): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/recipes/${recipeId}/restore`,
  );
  return data;
}

export interface RecipeIngredientInput {
  item_id: number;
  kind: RecipeIngredientKind;
  quantity: number;
  unit_id: number;
  is_optional: boolean;
  note?: string;
  sort_order: number;
}

export async function updateAdminRecipeIngredients(
  recipeId: number,
  ingredients: RecipeIngredientInput[],
): Promise<AdminRecipeIngredient[]> {
  const { data } = await adminApiClient.put<AdminRecipeIngredient[]>(
    `/admin/recipes/${recipeId}/ingredients`,
    { ingredients },
  );
  return data;
}
