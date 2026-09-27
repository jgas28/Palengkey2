import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/services/api/notifications";
import { useAuthStore } from "@/stores/authStore";

export const unreadCountQueryKey = ["notifications", "unreadCount"];

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    enabled: isAuthenticated,
  });
}
