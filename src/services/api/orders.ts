import { apiClient } from "@/services/api/client";
import type { Order, OrderStats } from "@/types/order";
import type { PaginatedResponse } from "@/types/pagination";

export async function listOrders(page = 1): Promise<PaginatedResponse<Order>> {
  const { data } = await apiClient.get<PaginatedResponse<Order>>("/customer/orders", {
    params: { page },
  });
  return data;
}

export async function getOrderStats(): Promise<OrderStats> {
  const { data } = await apiClient.get<OrderStats>("/customer/order-stats");
  return data;
}

export async function getOrder(orderId: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/customer/orders/${orderId}`);
  return data;
}

export async function cancelOrder(
  orderId: number,
): Promise<{ success: boolean; message: string; data: Order }> {
  const { data } = await apiClient.patch<{
    success: boolean;
    message: string;
    data: Order;
  }>(`/customer/orders/${orderId}/cancel`);
  return data;
}

export async function downloadInvoice(orderId: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/customer/orders/${orderId}/invoice/download`,
    { responseType: "blob" },
  );
  return data;
}
