import { adminApiClient } from "@/services/api/adminClient";
import type { AdminCareer, AdminCareerPage, CareerJobType, CareerStatus } from "@/types/adminCareer";

export interface ListAdminCareersParams {
  search?: string;
  status?: CareerStatus | "all";
  page?: number;
}

export async function listAdminCareers(
  params: ListAdminCareersParams = {},
): Promise<AdminCareerPage> {
  const { data } = await adminApiClient.get<AdminCareerPage>("/admin/careers", {
    params: { search: params.search || undefined, status: params.status, page: params.page },
  });
  return data;
}

export interface CareerFormPayload {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
  job_type: CareerJobType;
  salary_range?: string;
  status: CareerStatus;
  expires_at?: string;
  is_active: boolean;
}

export async function createAdminCareer(payload: CareerFormPayload): Promise<AdminCareer> {
  const { data } = await adminApiClient.post<AdminCareer>("/admin/careers", payload);
  return data;
}

export async function updateAdminCareer(
  careerId: number,
  payload: CareerFormPayload,
): Promise<AdminCareer> {
  const { data } = await adminApiClient.patch<AdminCareer>(`/admin/careers/${careerId}`, payload);
  return data;
}

export async function deleteAdminCareer(careerId: number): Promise<{ message: string }> {
  const { data } = await adminApiClient.delete<{ message: string }>(`/admin/careers/${careerId}`);
  return data;
}
