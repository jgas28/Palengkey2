import { adminApiClient } from "@/services/api/adminClient";
import type { AdminRole } from "@/types/adminAuth";
import type { AdminManagedUser } from "@/types/adminUser";

export async function listAdminUsers(): Promise<AdminManagedUser[]> {
  const { data } = await adminApiClient.get<AdminManagedUser[]>("/admin/users");
  return data;
}

export interface CreateAdminUserPayload {
  fname: string;
  lname: string;
  mname?: string;
  email: string;
  password: string;
  role: AdminRole;
  market_id?: number;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminManagedUser> {
  const { data } = await adminApiClient.post<AdminManagedUser>("/admin/users", payload);
  return data;
}

export interface UpdateAdminUserPayload {
  fname?: string;
  lname?: string;
  mname?: string;
  email?: string;
  role?: AdminRole;
  market_id?: number | null;
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserPayload,
): Promise<AdminManagedUser> {
  const { data } = await adminApiClient.patch<AdminManagedUser>(
    `/admin/users/${userId}`,
    payload,
  );
  return data;
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await adminApiClient.delete(`/admin/users/${userId}`);
}

export async function resetAdminUserPassword(
  userId: number,
  password: string,
): Promise<void> {
  await adminApiClient.post(`/admin/users/${userId}/reset-password`, { password });
}
