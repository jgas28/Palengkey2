import { apiClient } from "@/services/api/client";
import type { Notification } from "@/types/notification";

export async function listNotifications(
  unreadOnly = false,
): Promise<{ notifications: Notification[]; unread_count: number }> {
  const { data } = await apiClient.get<{
    notifications: Notification[];
    unread_count: number;
  }>("/customer/notifications", {
    params: unreadOnly ? { unread_only: true } : undefined,
  });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ unread_count: number }>(
    "/customer/notifications/unread-count",
  );
  return data.unread_count;
}

export async function markAsRead(id: number): Promise<Notification> {
  const { data } = await apiClient.post<{ notification: Notification }>(
    `/customer/notifications/${id}/read`,
  );
  return data.notification;
}

export async function markAllAsRead(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/customer/notifications/mark-all-read",
  );
  return data;
}

export async function clearAllNotifications(): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    "/customer/notifications/clear",
  );
  return data;
}
