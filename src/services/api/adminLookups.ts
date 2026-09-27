import { adminApiClient } from "@/services/api/adminClient";
import type { AdminMarketOption, LookupOption } from "@/types/adminItem";

export async function listAdminCategories(): Promise<LookupOption[]> {
  const { data } = await adminApiClient.get<LookupOption[]>("/admin/categories");
  return data;
}

export async function listAdminTypes(): Promise<LookupOption[]> {
  const { data } = await adminApiClient.get<LookupOption[]>("/admin/types");
  return data;
}

export async function listAdminUnits(): Promise<LookupOption[]> {
  const { data } = await adminApiClient.get<LookupOption[]>("/admin/units");
  return data;
}

export async function listAdminMarkets(): Promise<AdminMarketOption[]> {
  const { data } = await adminApiClient.get<AdminMarketOption[]>("/admin/markets");
  return data;
}

export async function listAdminRecipeTypes(): Promise<LookupOption[]> {
  const { data } = await adminApiClient.get<LookupOption[]>("/admin/recipe-types");
  return data;
}
