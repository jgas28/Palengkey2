import { apiClient } from "@/services/api/client";
import type { OrderFeedback, SubmitFeedbackPayload } from "@/types/feedback";

export async function getOrderFeedback(orderId: number): Promise<OrderFeedback | null> {
  const { data } = await apiClient.get<{ success: boolean; data: OrderFeedback | null }>(
    "/customer/order-feedback",
    { params: { order_id: orderId } },
  );
  return data.data;
}

export async function submitOrderFeedback(
  payload: SubmitFeedbackPayload,
): Promise<OrderFeedback> {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    data: OrderFeedback;
  }>("/customer/order-feedback", payload);
  return data.data;
}
