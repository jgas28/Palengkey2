import { apiClient } from "@/services/api/client";
import type { ProductType } from "@/types/productType";

export async function listProductTypes(): Promise<ProductType[]> {
  const { data } = await apiClient.get<{ data: ProductType[] }>("/customer/types");
  return data.data;
}
