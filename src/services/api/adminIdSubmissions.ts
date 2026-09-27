import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminIdSubmissionCounts,
  AdminIdSubmissionDetail,
  AdminIdSubmissionPage,
  IdSubmissionFilter,
} from "@/types/adminIdSubmission";

export async function listAdminIdSubmissions(
  status: IdSubmissionFilter,
  search?: string,
  page = 1,
): Promise<{ submissions: AdminIdSubmissionPage; counts: AdminIdSubmissionCounts }> {
  const { data } = await adminApiClient.get<{
    submissions: AdminIdSubmissionPage;
    counts: AdminIdSubmissionCounts;
  }>("/admin/id-submissions", { params: { status, search, page } });
  return data;
}

export async function getAdminIdSubmission(id: number): Promise<AdminIdSubmissionDetail> {
  const { data } = await adminApiClient.get<AdminIdSubmissionDetail>(
    `/admin/id-submissions/${id}`,
  );
  return data;
}

export async function approveAdminIdSubmission(
  id: number,
  notes?: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/id-submissions/${id}/approve`,
    { notes },
  );
  return data;
}

export async function rejectAdminIdSubmission(
  id: number,
  reason: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/id-submissions/${id}/reject`,
    { reason },
  );
  return data;
}
