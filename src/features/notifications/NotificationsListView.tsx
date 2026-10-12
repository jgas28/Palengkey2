import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  notificationIcon,
  notificationTarget,
} from "@/features/notifications/notificationLinks";
import Icon from "@/components/pk/Icon";
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
    const target = notificationTarget(notification);
    if (target) navigate(target);
  }

  function handleClearAll() {
    if (window.confirm("Clear all notifications?")) {
      clearMutation.mutate();
    }
  }

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((notification) => !notification.is_read);

  const iconFor = notificationIcon;

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title page-title-action">
        <div>
          <p className="kicker">Updates</p>
          <h1>Notifications</h1>
          <p>Order activity, account updates, and fresh deals.</p>
        </div>
        {notifications.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {hasUnread && (
              <button
                type="button"
                className="mark-read"
                disabled={markAllMutation.isPending}
                onClick={() => markAllMutation.mutate()}
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              className="mark-read"
              style={{ color: "#b13c3c" }}
              disabled={clearMutation.isPending}
              onClick={handleClearAll}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      <section className="shell notification-list">
        {isLoading ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="bell" size={34} />
            <h3>Loading notifications…</h3>
          </div>
        ) : isError ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="bell" size={34} />
            <h3>No notifications yet</h3>
            <p>Order updates and deals will show up here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              className={notification.is_read ? "read" : ""}
              key={notification.id}
              onClick={() => handleOpen(notification)}
            >
              <span>
                <Icon name={iconFor(notification)} />
              </span>
              <div>
                <h2>{notification.title}</h2>
                <p>{notification.message}</p>
                <small>{new Date(notification.created_at).toLocaleString("en-PH")}</small>
              </div>
              {!notification.is_read ? (
                <i></i>
              ) : (
                <span style={{ width: 0, height: 0, background: "none" }} />
              )}
              <Icon name="chevron" />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
