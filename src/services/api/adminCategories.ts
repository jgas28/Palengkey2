import { adminApiClient } from "@/services/api/adminClient";
import type { AdminCategory, AdminCategoryPage } from "@/types/adminCategory";

export interface ListAdminCategoriesParams {
  search?: string;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminCategoriesPage(
  params: ListAdminCategoriesParams = {},
): Promise<AdminCategoryPage> {
  const { data } = await adminApiClient.get<AdminCategoryPage>(
    "/admin/manage-categories",
    {
      params: {
        search: params.search || undefined,
        status: params.status,
        page: params.page,
      },
    },
  );
  return data;
}

/** Empty string = no bulk pricing for this category. */
export async function createAdminCategory(
  name: string,
  image?: File,
  bulkMinKg = "",
): Promise<AdminCategory> {
  const form = new FormData();
  form.append("name", name);
  form.append("bulk_min_kg", bulkMinKg);
  if (image) form.append("image", image);

  const { data } = await adminApiClient.post<AdminCategory>(
    "/admin/manage-categories",
    form,
  );
  return data;
}

export async function updateAdminCategory(
  categoryId: number,
  name: string,
  image?: File,
  bulkMinKg = "",
): Promise<AdminCategory> {
  const form = new FormData();
  form.append("name", name);
  form.append("bulk_min_kg", bulkMinKg);
  if (image) form.append("image", image);

  const { data } = await adminApiClient.post<AdminCategory>(
    `/admin/manage-categories/${categoryId}`,
    form,
  );
  return data;
}

export async function deactivateAdminCategory(
  categoryId: number,
): Promise<AdminCategory> {
  const { data } = await adminApiClient.delete<AdminCategory>(
    `/admin/manage-categories/${categoryId}`,
  );
  return data;
}

export async function restoreAdminCategory(categoryId: number): Promise<AdminCategory> {
  const { data } = await adminApiClient.post<AdminCategory>(
    `/admin/manage-categories/${categoryId}/restore`,
  );
  return data;
}
