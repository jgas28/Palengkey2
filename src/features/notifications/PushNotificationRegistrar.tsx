import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { registerForPushNotifications } from "@/utils/pushNotifications";

/** Registers this device for push once the customer is logged in. Renders nothing. */
export default function PushNotificationRegistrar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications();
    }
  }, [isAuthenticated]);

  return null;
}
