import { adminApiClient } from "@/services/api/adminClient";
import type { AdminUser } from "@/types/adminAuth";

export async function adminLogin(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AdminUser }> {
  const { data } = await adminApiClient.post<{ token: string; user: AdminUser }>(
    "/admin/login",
    payload,
  );
  return data;
}

export async function adminMe(): Promise<{ user: AdminUser }> {
  const { data } = await adminApiClient.get<{ user: AdminUser }>("/admin/me");
  return data;
}

export async function adminLogout(): Promise<void> {
  await adminApiClient.post("/admin/logout");
}
