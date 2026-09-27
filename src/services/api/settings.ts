import { apiClient } from "@/services/api/client";
import type { CustomerSettings } from "@/types/settings";

export async function getSettings(): Promise<CustomerSettings> {
  const { data } = await apiClient.get<{ data: CustomerSettings }>("/customer/settings");
  return data.data;
}
