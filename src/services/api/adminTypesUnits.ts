import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminProductType,
  AdminProductTypePage,
  AdminUnit,
  AdminUnitPage,
} from "@/types/adminTypeUnit";

export interface ListParams {
  search?: string;
  status?: "0" | "1";
  page?: number;
}

export async function listAdminTypes(params: ListParams = {}): Promise<AdminProductTypePage> {
  const { data } = await adminApiClient.get<AdminProductTypePage>("/admin/manage-types", {
    params: { search: params.search || undefined, status: params.status, page: params.page },
  });
  return data;
}

export async function createAdminType(name: string): Promise<AdminProductType> {
  const { data } = await adminApiClient.post<AdminProductType>("/admin/manage-types", { name });
  return data;
}

export async function updateAdminType(typeId: number, name: string): Promise<AdminProductType> {
  const { data } = await adminApiClient.post<AdminProductType>(`/admin/manage-types/${typeId}`, {
    name,
  });
  return data;
}

export async function deactivateAdminType(typeId: number): Promise<AdminProductType> {
  const { data } = await adminApiClient.delete<AdminProductType>(`/admin/manage-types/${typeId}`);
  return data;
}

export async function restoreAdminType(typeId: number): Promise<AdminProductType> {
  const { data } = await adminApiClient.post<AdminProductType>(
    `/admin/manage-types/${typeId}/restore`,
  );
  return data;
}

export async function listAdminUnits(params: ListParams = {}): Promise<AdminUnitPage> {
  const { data } = await adminApiClient.get<AdminUnitPage>("/admin/manage-units", {
    params: { search: params.search || undefined, status: params.status, page: params.page },
  });
  return data;
}

export async function createAdminUnit(name: string, shortName: string): Promise<AdminUnit> {
  const { data } = await adminApiClient.post<AdminUnit>("/admin/manage-units", {
    name,
    short_name: shortName,
  });
  return data;
}

export async function updateAdminUnit(
  unitId: number,
  name: string,
  shortName: string,
): Promise<AdminUnit> {
  const { data } = await adminApiClient.post<AdminUnit>(`/admin/manage-units/${unitId}`, {
    name,
    short_name: shortName,
  });
  return data;
}

export async function deactivateAdminUnit(unitId: number): Promise<AdminUnit> {
  const { data } = await adminApiClient.delete<AdminUnit>(`/admin/manage-units/${unitId}`);
  return data;
}

export async function restoreAdminUnit(unitId: number): Promise<AdminUnit> {
  const { data } = await adminApiClient.post<AdminUnit>(`/admin/manage-units/${unitId}/restore`);
  return data;
}
