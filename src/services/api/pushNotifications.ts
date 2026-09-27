import { apiClient } from "@/services/api/client";

export async function registerPushToken(fcmToken: string): Promise<void> {
  await apiClient.post("/customer/devices/fcm-token", { fcm_token: fcmToken });
}
