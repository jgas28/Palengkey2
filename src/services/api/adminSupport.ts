import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminSupportMessage,
  AdminSupportThread,
  AdminSupportThreadPage,
  SupportThreadStatus,
} from "@/types/adminSupport";

export async function listAdminSupportThreads(
  status: SupportThreadStatus | "all",
): Promise<AdminSupportThreadPage> {
  const { data } = await adminApiClient.get<AdminSupportThreadPage>("/admin/support", {
    params: { status },
  });
  return data;
}

export async function getAdminSupportThread(
  threadId: number,
): Promise<AdminSupportThread> {
  const { data } = await adminApiClient.get<AdminSupportThread>(
    `/admin/support/${threadId}`,
  );
  return data;
}

export async function getAdminSupportMessages(
  threadId: number,
  afterId = 0,
): Promise<{
  messages: AdminSupportMessage[];
  latest_message_id: number;
  unread_count: number;
}> {
  const { data } = await adminApiClient.get<{
    messages: AdminSupportMessage[];
    latest_message_id: number;
    unread_count: number;
  }>(`/admin/support/${threadId}/messages`, { params: { after_id: afterId } });
  return data;
}

export async function sendAdminSupportMessage(
  threadId: number,
  body: string,
): Promise<AdminSupportMessage> {
  const { data } = await adminApiClient.post<{ message: AdminSupportMessage }>(
    `/admin/support/${threadId}/messages`,
    { body },
  );
  return data.message;
}

export async function closeAdminSupportThread(threadId: number): Promise<void> {
  await adminApiClient.post(`/admin/support/${threadId}/close`);
}

export async function reopenAdminSupportThread(threadId: number): Promise<void> {
  await adminApiClient.post(`/admin/support/${threadId}/reopen`);
}

export async function getAdminSupportUnreadCount(): Promise<number> {
  const { data } = await adminApiClient.get<{ unread_count: number }>(
    "/admin/support/unread-count",
  );
  return data.unread_count;
}
