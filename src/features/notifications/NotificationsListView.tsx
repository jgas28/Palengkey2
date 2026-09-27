import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  clearAllNotifications,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "@/services/api/notifications";
import { unreadCountQueryKey } from "@/features/notifications/useUnreadCount";
import { useToastStore } from "@/stores/toastStore";
import type { Notification } from "@/types/notification";

export default function NotificationsListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
  };

  const readMutation = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      invalidate();
      showToast("All notifications marked as read", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => {
      invalidate();
      showToast("Notifications cleared", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not clear.", "error");
    },
  });

  function handleOpen(notification: Notification) {
    if (!notification.is_read) {
      readMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.order_id) {
      navigate(`/orders/${notification.order_id}`);
    }
  }

  function handleClearAll() {
    if (window.confirm("Clear all notifications?")) {
      clearMutation.mutate();
    }
  }

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((notification) => !notification.is_read);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-bold text-text">Notifications</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🔔</span>}
          title="No notifications yet."
        />
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleOpen(notification)}
                className={`flex flex-col items-start gap-1 rounded-card border p-3.5 text-left shadow-soft transition-colors ${
                  notification.is_read
                    ? "border-border bg-surface"
                    : "border-primary-100 bg-primary-50"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">
                    {notification.title}
                  </span>
                  {!notification.is_read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />
                  )}
                </div>
                <p className="text-sm text-text-muted">{notification.message}</p>
                <span className="text-xs text-text-muted">
                  {new Date(notification.created_at).toLocaleString("en-PH")}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {hasUnread && (
              <Button
                variant="secondary"
                loading={markAllMutation.isPending}
                onClick={() => markAllMutation.mutate()}
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              loading={clearMutation.isPending}
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
