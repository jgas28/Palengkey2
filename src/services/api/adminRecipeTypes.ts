import { adminApiClient } from "@/services/api/adminClient";
import type { AdminRecipeType, AdminRecipeTypePage } from "@/types/adminRecipeType";

export interface ListParams {
  search?: string;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminRecipeTypes(
  params: ListParams = {},
): Promise<AdminRecipeTypePage> {
  const { data } = await adminApiClient.get<AdminRecipeTypePage>("/admin/manage-recipe-types", {
    params: { search: params.search || undefined, status: params.status, page: params.page },
  });
  return data;
}

export async function createAdminRecipeType(name: string): Promise<AdminRecipeType> {
  const { data } = await adminApiClient.post<AdminRecipeType>("/admin/manage-recipe-types", {
    name,
  });
  return data;
}

export async function updateAdminRecipeType(
  recipeTypeId: number,
  name: string,
): Promise<AdminRecipeType> {
  const { data } = await adminApiClient.post<AdminRecipeType>(
    `/admin/manage-recipe-types/${recipeTypeId}`,
    { name },
  );
  return data;
}

export async function deactivateAdminRecipeType(recipeTypeId: number): Promise<AdminRecipeType> {
  const { data } = await adminApiClient.delete<AdminRecipeType>(
    `/admin/manage-recipe-types/${recipeTypeId}`,
  );
  return data;
}

export async function restoreAdminRecipeType(recipeTypeId: number): Promise<AdminRecipeType> {
  const { data } = await adminApiClient.post<AdminRecipeType>(
    `/admin/manage-recipe-types/${recipeTypeId}/restore`,
  );
  return data;
}
