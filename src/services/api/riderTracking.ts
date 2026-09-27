import { apiClient } from "@/services/api/client";
import type { RiderLocation } from "@/types/order";

/** Returns null when the order isn't out for delivery yet or has no rider assigned
 * (the backend 404s in that case — not an error state, just "not available yet"). */
export async function getRiderLocation(orderId: number): Promise<RiderLocation | null> {
  try {
    const { data } = await apiClient.get<{ success: boolean; data: RiderLocation }>(
      `/customer/order/${orderId}/rider-location`,
    );
    return data.data;
  } catch {
    return null;
  }
}
