import { apiClient } from "@/services/api/client";
import type { Category } from "@/types/category";

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<{ data: Category[] }>("/customer/categories");
  return data.data;
}
