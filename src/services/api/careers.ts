import { apiClient } from "@/services/api/client";
import type { Career } from "@/types/career";

export async function listCareers(): Promise<Career[]> {
  const { data } = await apiClient.get<Career[]>("/customer/careers");
  return data;
}
