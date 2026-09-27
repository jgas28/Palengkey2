import { adminApiClient } from "@/services/api/adminClient";
import type { AdminMarket, AdminMarketPage, AdminMarketStatus } from "@/types/adminMarket";

export interface ListAdminMarketsParams {
  search?: string;
  status?: AdminMarketStatus;
  page?: number;
}

export async function listAdminMarketsFull(
  params: ListAdminMarketsParams = {},
): Promise<AdminMarketPage> {
  const { data } = await adminApiClient.get<AdminMarketPage>("/admin/manage-markets", {
    params: {
      search: params.search || undefined,
      status: params.status,
      page: params.page,
    },
  });
  return data;
}

export interface MarketFormPayload {
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  status?: AdminMarketStatus;
  cutoff_time?: string;
  cutoff_timezone?: string;
  image?: File;
}

function toFormData(payload: Partial<MarketFormPayload>): FormData {
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.location !== undefined) form.append("location", payload.location);
  if (payload.address !== undefined) form.append("address", payload.address);
  if (payload.latitude !== undefined) form.append("latitude", String(payload.latitude));
  if (payload.longitude !== undefined) form.append("longitude", String(payload.longitude));
  if (payload.status !== undefined) form.append("status", String(payload.status));
  if (payload.cutoff_time) form.append("cutoff_time", payload.cutoff_time);
  if (payload.cutoff_timezone) form.append("cutoff_timezone", payload.cutoff_timezone);
  if (payload.image) form.append("image", payload.image);
  return form;
}

export async function createAdminMarket(payload: MarketFormPayload): Promise<AdminMarket> {
  const { data } = await adminApiClient.post<AdminMarket>(
    "/admin/manage-markets",
    toFormData(payload),
  );
  return data;
}

export async function updateAdminMarket(
  marketId: number,
  payload: Partial<MarketFormPayload>,
): Promise<AdminMarket> {
  const { data } = await adminApiClient.post<AdminMarket>(
    `/admin/manage-markets/${marketId}`,
    toFormData(payload),
  );
  return data;
}

export async function deactivateAdminMarket(
  marketId: number,
): Promise<{ message: string; market: AdminMarket }> {
  const { data } = await adminApiClient.delete<{ message: string; market: AdminMarket }>(
    `/admin/manage-markets/${marketId}`,
  );
  return data;
}
