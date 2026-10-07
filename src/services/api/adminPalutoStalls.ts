import { adminApiClient } from "@/services/api/adminClient";
import type { AdminPalutoStall, AdminPalutoStallListPage } from "@/types/adminPalutoStall";

export interface ListAdminPalutoStallsParams {
  search?: string;
  marketId?: number;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminPalutoStalls(
  params: ListAdminPalutoStallsParams = {},
): Promise<AdminPalutoStallListPage> {
  const { data } = await adminApiClient.get<AdminPalutoStallListPage>(
    "/admin/paluto-stalls",
    {
      params: {
        search: params.search || undefined,
        market_id: params.marketId,
        status: params.status,
        page: params.page,
      },
    },
  );
  return data;
}

export interface PalutoStallFormPayload {
  name: string;
  market_id: number;
  description?: string;
  contact_phone?: string;
  is_accepting_orders?: boolean;
  prep_time_minutes?: number | null;
  image?: File;
}

function toStallFormData(payload: Partial<PalutoStallFormPayload>): FormData {
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.market_id !== undefined) form.append("market_id", String(payload.market_id));
  if (payload.description) form.append("description", payload.description);
  if (payload.contact_phone) form.append("contact_phone", payload.contact_phone);
  if (payload.is_accepting_orders !== undefined) {
    form.append("is_accepting_orders", payload.is_accepting_orders ? "1" : "0");
  }
  if (payload.prep_time_minutes !== undefined && payload.prep_time_minutes !== null) {
    form.append("prep_time_minutes", String(payload.prep_time_minutes));
  }
  if (payload.image) form.append("image", payload.image);
  return form;
}

export async function createAdminPalutoStall(
  payload: PalutoStallFormPayload,
): Promise<AdminPalutoStall> {
  const { data } = await adminApiClient.post<AdminPalutoStall>(
    "/admin/paluto-stalls",
    toStallFormData(payload),
  );
  return data;
}

export async function updateAdminPalutoStall(
  stallId: number,
  payload: Partial<PalutoStallFormPayload>,
): Promise<AdminPalutoStall> {
  const { data } = await adminApiClient.post<AdminPalutoStall>(
    `/admin/paluto-stalls/${stallId}`,
    toStallFormData(payload),
  );
  return data;
}

export async function deactivateAdminPalutoStall(
  stallId: number,
): Promise<{ message: string; stall: AdminPalutoStall }> {
  const { data } = await adminApiClient.delete<{ message: string; stall: AdminPalutoStall }>(
    `/admin/paluto-stalls/${stallId}`,
  );
  return data;
}

export async function restoreAdminPalutoStall(
  stallId: number,
): Promise<{ message: string; stall: AdminPalutoStall }> {
  const { data } = await adminApiClient.post<{ message: string; stall: AdminPalutoStall }>(
    `/admin/paluto-stalls/${stallId}/restore`,
  );
  return data;
}
