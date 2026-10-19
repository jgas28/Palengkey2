import { apiClient } from "@/services/api/client";
import type { Category } from "@/types/category";

/** With a market, items_count only counts what that market's shop lists. */
export async function listCategories(marketId?: number): Promise<Category[]> {
  const { data } = await apiClient.get<{ data: Category[] }>("/customer/categories", {
    params: { market_id: marketId },
  });
  return data.data;
}
