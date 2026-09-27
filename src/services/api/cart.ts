import { apiClient } from "@/services/api/client";
import type { CartResponse } from "@/types/cart";

export async function getCart(itemIds?: number[]): Promise<CartResponse> {
  const { data } = await apiClient.get<CartResponse>("/customer/cart", {
    params: itemIds?.length ? { item_ids: itemIds.join(",") } : undefined,
  });
  return data;
}

export interface AddToCartPayload {
  item_id: number;
  quantity: number;
  market_id: number;
  weight_kg?: number;
  customer_note?: string;
}

export async function addToCart(
  payload: AddToCartPayload,
): Promise<{ success: boolean; data: CartResponse }> {
  const { data } = await apiClient.post<{ success: boolean; data: CartResponse }>(
    "/customer/cart/add",
    payload,
  );
  return data;
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  customerNote?: string,
): Promise<CartResponse> {
  const { data } = await apiClient.patch<CartResponse>(
    `/customer/cart/item/${cartItemId}`,
    { quantity, ...(customerNote !== undefined ? { customer_note: customerNote } : {}) },
  );
  return data;
}

export async function removeCartItem(cartItemId: number): Promise<CartResponse> {
  const { data } = await apiClient.delete<CartResponse>(
    `/customer/cart/item/${cartItemId}`,
  );
  return data;
}

export async function clearCart(): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>("/customer/cart/clear");
  return data;
}
