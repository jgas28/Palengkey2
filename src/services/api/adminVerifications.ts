import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminUnverifiedCustomerPage,
  AdminVerificationCounts,
  AdminVerificationDetail,
  AdminVerificationPage,
  VerificationFilter,
} from "@/types/adminVerification";

export async function listAdminVerifications(
  status: VerificationFilter,
  search?: string,
  page = 1,
): Promise<{ entries: AdminVerificationPage; counts: AdminVerificationCounts }> {
  const { data } = await adminApiClient.get<{
    entries: AdminVerificationPage;
    counts: AdminVerificationCounts;
  }>("/admin/customer-verifications", { params: { status, search, page } });
  return data;
}

export async function getAdminVerificationStats(): Promise<AdminVerificationCounts> {
  const { data } = await adminApiClient.get<AdminVerificationCounts>(
    "/admin/customer-verifications/stats",
  );
  return data;
}

export async function getAdminVerification(id: number): Promise<AdminVerificationDetail> {
  const { data } = await adminApiClient.get<AdminVerificationDetail>(
    `/admin/customer-verifications/${id}`,
  );
  return data;
}

export async function approveAdminVerification(
  id: number,
  notes?: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/customer-verifications/${id}/approve`,
    { notes },
  );
  return data;
}

export async function rejectAdminVerification(
  id: number,
  reason: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/customer-verifications/${id}/reject`,
    { reason },
  );
  return data;
}

export async function approveAdminVerificationAccount(
  customerId: number,
  notes?: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/customer-verifications/customer/${customerId}/approve`,
    { notes },
  );
  return data;
}

export async function rejectAdminVerificationAccount(
  customerId: number,
  reason: string,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/customer-verifications/customer/${customerId}/reject`,
    { reason },
  );
  return data;
}

export async function listAdminUnverifiedCustomers(
  page = 1,
): Promise<AdminUnverifiedCustomerPage> {
  const { data } = await adminApiClient.get<AdminUnverifiedCustomerPage>(
    "/admin/customer-verifications/unverified",
    { params: { page } },
  );
  return data;
}
