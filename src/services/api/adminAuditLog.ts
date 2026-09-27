import { adminApiClient } from "@/services/api/adminClient";
import type { AdminAuditLogPage, AuditLogUserOption } from "@/types/adminAuditLog";

export interface ListAuditLogParams {
  search?: string;
  action?: string;
  userId?: number;
  page?: number;
}

export async function listAdminAuditLogs(
  params: ListAuditLogParams = {},
): Promise<AdminAuditLogPage> {
  const { data } = await adminApiClient.get<AdminAuditLogPage>("/admin/audit-logs", {
    params: {
      search: params.search || undefined,
      action: params.action || undefined,
      user_id: params.userId,
      page: params.page,
    },
  });
  return data;
}

export async function listAuditLogUsers(): Promise<AuditLogUserOption[]> {
  const { data } = await adminApiClient.get<AuditLogUserOption[]>(
    "/admin/audit-logs/users",
  );
  return data;
}
