import { apiClient } from "@/services/api/client";
import type { CartResponse } from "@/types/cart";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  AddRecipeToCartPayload,
  RecipeDetail,
  RecipeSummary,
  RecipeType,
} from "@/types/paluto";

export interface ListRecipesParams {
  marketId: number;
  recipeTypeId?: number;
  search?: string;
  page?: number;
}

export async function listRecipes(
  params: ListRecipesParams,
): Promise<PaginatedResponse<RecipeSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<RecipeSummary>>(
    "/customer/recipes",
    {
      params: {
        market_id: params.marketId,
        recipe_type_id: params.recipeTypeId,
        search: params.search || undefined,
        page: params.page,
      },
    },
  );
  return data;
}

export async function listRecipeTypes(): Promise<RecipeType[]> {
  const { data } = await apiClient.get<{ data: RecipeType[] }>("/customer/recipe-types");
  return data.data;
}

export async function getRecipe(
  recipeId: number,
  marketId: number,
): Promise<RecipeDetail> {
  const { data } = await apiClient.get<RecipeDetail>(`/customer/recipes/${recipeId}`, {
    params: { market_id: marketId },
  });
  return data;
}

export async function addRecipeToCart(
  payload: AddRecipeToCartPayload,
): Promise<{ success: boolean; data: CartResponse }> {
  const { data } = await apiClient.post<{ success: boolean; data: CartResponse }>(
    "/customer/cart/add-recipe",
    payload,
  );
  return data;
}

export async function removeRecipeBundle(bundleId: number): Promise<CartResponse> {
  const { data } = await apiClient.delete<CartResponse>(
    `/customer/cart/recipe-bundle/${bundleId}`,
  );
  return data;
}
