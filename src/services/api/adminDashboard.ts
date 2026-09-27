import { adminApiClient } from "@/services/api/adminClient";
import type { AdminDashboard } from "@/types/adminDashboard";

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await adminApiClient.get<AdminDashboard>("/admin/dashboard");
  return data;
}
