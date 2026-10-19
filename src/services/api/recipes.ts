import { apiClient } from "@/services/api/client";
import type { CartResponse } from "@/types/cart";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  AddRecipeToCartPayload,
  RecipeDetail,
  RecipeSummary,
  RecipeType,
} from "@/types/recipe";

export interface ListRecipesParams {
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

/** Ingredient prices and availability come from the given market. */
export async function getRecipe(
  recipeId: number,
  marketId?: number,
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
