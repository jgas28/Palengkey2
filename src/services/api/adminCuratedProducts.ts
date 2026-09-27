import { adminApiClient } from "@/services/api/adminClient";
import type { AdminCuratedProduct, CuratedSection } from "@/types/adminCuratedProduct";

export async function listAdminCuratedProducts(
  section: CuratedSection,
): Promise<AdminCuratedProduct[]> {
  const { data } = await adminApiClient.get<{ data: AdminCuratedProduct[] }>(
    "/admin/curated-products",
    { params: { section } },
  );
  return data.data;
}

export async function createAdminCuratedProduct(payload: {
  section: CuratedSection;
  item_id: number;
}): Promise<AdminCuratedProduct> {
  const { data } = await adminApiClient.post<AdminCuratedProduct>(
    "/admin/curated-products",
    payload,
  );
  return data;
}

export async function updateAdminCuratedProduct(
  id: number,
  payload: { sort_order?: number; is_active?: boolean },
): Promise<AdminCuratedProduct> {
  const { data } = await adminApiClient.patch<AdminCuratedProduct>(
    `/admin/curated-products/${id}`,
    payload,
  );
  return data;
}

export async function deleteAdminCuratedProduct(id: number): Promise<void> {
  await adminApiClient.delete(`/admin/curated-products/${id}`);
}
