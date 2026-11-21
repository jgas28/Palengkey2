import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminDiscountIdDetail,
  AdminDiscountIdPage,
  DiscountIdFilter,
} from "@/types/discountId";

export async function listAdminDiscountIds(
  status: DiscountIdFilter,
  search = "",
  page = 1,
): Promise<AdminDiscountIdPage> {
  const { data } = await adminApiClient.get<AdminDiscountIdPage>("/admin/discount-ids", {
    params: { status, search: search || undefined, page },
  });
  return data;
}

export async function getAdminDiscountId(id: number): Promise<AdminDiscountIdDetail> {
  const { data } = await adminApiClient.get<AdminDiscountIdDetail>(`/admin/discount-ids/${id}`);
  return data;
}

/** The ID photos are private: fetched with the admin's login and shown from memory. */
export async function getAdminDiscountIdFile(
  id: number,
  side: "front" | "back" | "selfie",
): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>(`/admin/discount-ids/${id}/file/${side}`, {
    responseType: "blob",
  });
  return data;
}

export async function approveAdminDiscountId(id: number, notes?: string): Promise<void> {
  await adminApiClient.post(`/admin/discount-ids/${id}/approve`, { notes });
}

export async function rejectAdminDiscountId(id: number, reason: string): Promise<void> {
  await adminApiClient.post(`/admin/discount-ids/${id}/reject`, { reason });
}
