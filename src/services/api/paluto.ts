import { apiClient } from "@/services/api/client";
import type { CartResponse } from "@/types/cart";
import type {
  AddPalutoDishToCartPayload,
  PalutoStallMenu,
  PalutoStallSummary,
} from "@/types/paluto";

export async function listPalutoStalls(marketId: number): Promise<PalutoStallSummary[]> {
  const { data } = await apiClient.get<{ data: PalutoStallSummary[] }>(
    "/customer/paluto/stalls",
    { params: { market_id: marketId } },
  );
  return data.data;
}

export async function getPalutoStall(stallId: number): Promise<PalutoStallMenu> {
  const { data } = await apiClient.get<PalutoStallMenu>(
    `/customer/paluto/stalls/${stallId}`,
  );
  return data;
}

export async function addPalutoDishToCart(
  payload: AddPalutoDishToCartPayload,
): Promise<{ success: boolean; data: CartResponse }> {
  const { data } = await apiClient.post<{ success: boolean; data: CartResponse }>(
    "/customer/cart/add-paluto-dish",
    payload,
  );
  return data;
}

/** Removes a whole bundle — Buy Raw recipe or stall-cooked dish — from the cart. */
export async function removeRecipeBundle(bundleId: number): Promise<CartResponse> {
  const { data } = await apiClient.delete<CartResponse>(
    `/customer/cart/recipe-bundle/${bundleId}`,
  );
  return data;
}
