import { adminApiClient } from "@/services/api/adminClient";
import type { AdminItem, AdminItemImage, AdminItemListPage } from "@/types/adminItem";

export interface ListAdminItemsParams {
  search?: string;
  marketId?: number;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminItems(
  params: ListAdminItemsParams = {},
): Promise<AdminItemListPage> {
  const { data } = await adminApiClient.get<AdminItemListPage>("/admin/items", {
    params: {
      search: params.search || undefined,
      market_id: params.marketId,
      status: params.status,
      page: params.page,
    },
  });
  return data;
}

export async function getAdminItem(
  itemId: number,
  marketId?: number,
): Promise<AdminItem> {
  const { data } = await adminApiClient.get<AdminItem>(`/admin/items/${itemId}`, {
    params: { market_id: marketId },
  });
  return data;
}

export interface CreateAdminItemPayload {
  name: string;
  description?: string;
  picture_url: File;
  category_id: number;
  type_id?: number;
  unit_id: number;
  price: number;
  is_available: boolean;
  cutoff_time?: string;
  market_id?: number;
}

export async function createAdminItem(
  payload: CreateAdminItemPayload,
): Promise<AdminItem> {
  const form = new FormData();
  form.append("name", payload.name);
  if (payload.description) form.append("description", payload.description);
  form.append("picture_url", payload.picture_url);
  form.append("category_id", String(payload.category_id));
  if (payload.type_id) form.append("type_id", String(payload.type_id));
  form.append("unit_id", String(payload.unit_id));
  form.append("price", String(payload.price));
  form.append("is_available", payload.is_available ? "1" : "0");
  if (payload.cutoff_time) form.append("cutoff_time", payload.cutoff_time);
  if (payload.market_id) form.append("market_id", String(payload.market_id));

  const { data } = await adminApiClient.post<AdminItem>("/admin/items", form);
  return data;
}

export interface UpdateAdminItemPayload {
  name?: string;
  description?: string;
  category_id?: number;
  type_id?: number;
  unit_id?: number;
}

export async function updateAdminItem(
  itemId: number,
  payload: UpdateAdminItemPayload,
): Promise<AdminItem> {
  const { data } = await adminApiClient.patch<AdminItem>(
    `/admin/items/${itemId}`,
    payload,
  );
  return data;
}

export interface UpdateMarketListingPayload {
  market_id?: number;
  price: number | null;
  is_available: boolean;
  cutoff_time?: string;
}

export async function updateAdminItemMarketListing(
  itemId: number,
  payload: UpdateMarketListingPayload,
): Promise<void> {
  await adminApiClient.patch(`/admin/items/${itemId}/market`, payload);
}

export async function uploadAdminItemImages(
  itemId: number,
  files: File[],
): Promise<AdminItemImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append("images[]", file));

  const { data } = await adminApiClient.post<AdminItemImage[]>(
    `/admin/items/${itemId}/images`,
    form,
  );
  return data;
}

export async function deleteAdminItemImage(
  itemId: number,
  imageId: number,
): Promise<void> {
  await adminApiClient.delete(`/admin/items/${itemId}/images/${imageId}`);
}

export async function deactivateAdminItem(itemId: number): Promise<{ message: string }> {
  const { data } = await adminApiClient.delete<{ message: string }>(`/admin/items/${itemId}`);
  return data;
}

export async function restoreAdminItem(itemId: number): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/items/${itemId}/restore`,
  );
  return data;
}
