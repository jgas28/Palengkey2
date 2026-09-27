import { apiClient } from "@/services/api/client";
import type {
  FormattedSupportMessage,
  SupportableOrder,
  SupportThread,
} from "@/types/support";

export async function getSupportOverview(): Promise<{
  threads: SupportThread[];
  orders: SupportableOrder[];
}> {
  const { data } = await apiClient.get<{
    threads: SupportThread[];
    orders: SupportableOrder[];
  }>("/customer/support");
  return data;
}

export async function openSupportForOrder(orderNumber: string): Promise<SupportThread> {
  const { data } = await apiClient.post<{ thread: SupportThread }>(
    `/customer/support/order/${orderNumber}/open`,
  );
  return data.thread;
}

export async function getSupportMessages(
  threadId: number,
): Promise<FormattedSupportMessage[]> {
  const { data } = await apiClient.get<{ messages: FormattedSupportMessage[] }>(
    `/customer/support/threads/${threadId}/messages`,
  );
  return data.messages;
}

export async function sendSupportMessage(
  threadId: number,
  body: string,
): Promise<FormattedSupportMessage> {
  const { data } = await apiClient.post<{ message: FormattedSupportMessage }>(
    `/customer/support/threads/${threadId}/messages`,
    { body },
  );
  return data.message;
}
