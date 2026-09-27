import { adminApiClient } from "@/services/api/adminClient";
import type { AdminRider, AdminRiderPage, AdminRiderTrackingEntry } from "@/types/adminRider";

export async function listAdminRiders(search?: string): Promise<AdminRiderPage> {
  const { data } = await adminApiClient.get<AdminRiderPage>("/admin/riders", {
    params: { search: search || undefined },
  });
  return data;
}

export interface CreateRiderPayload {
  name: string;
  phone: string;
  vehicle_type: string;
  market_id?: number;
}

export async function createAdminRider(payload: CreateRiderPayload): Promise<AdminRider> {
  const { data } = await adminApiClient.post<AdminRider>("/admin/riders", payload);
  return data;
}

export interface UpdateRiderPayload {
  name?: string;
  phone?: string;
  vehicle_type?: string;
  is_active?: boolean;
}

export async function updateAdminRider(
  riderId: number,
  payload: UpdateRiderPayload,
): Promise<AdminRider> {
  const { data } = await adminApiClient.patch<AdminRider>(`/admin/riders/${riderId}`, payload);
  return data;
}

export async function getAdminRiderTracking(): Promise<AdminRiderTrackingEntry[]> {
  const { data } = await adminApiClient.get<AdminRiderTrackingEntry[]>("/admin/riders/tracking");
  return data;
}
