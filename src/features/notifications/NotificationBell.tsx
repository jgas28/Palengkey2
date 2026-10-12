import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import {
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "@/services/api/notifications";
import {
  unreadCountQueryKey,
  useUnreadCount,
} from "@/features/notifications/useUnreadCount";
import {
  notificationIcon,
  notificationTarget,
  timeAgo,
} from "@/features/notifications/notificationLinks";
import type { Notification } from "@/types/notification";

/** Header bell: a dropdown of unread notifications; each one opens the page it's about. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadCount();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", "unreadList"],
    queryFn: () => listNotifications(true),
    enabled: open,
  });
  const unread = (data?.notifications ?? []).filter(
    (notification) => !notification.is_read,
  );

  function refreshCounts() {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
  }

  const readMutation = useMutation({ mutationFn: markAsRead, onSettled: refreshCounts });
  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSettled: refreshCounts,
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !ref.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function openNotification(notification: Notification) {
    readMutation.mutate(notification.id);
    setOpen(false);
    navigate(notificationTarget(notification) ?? "/notifications");
  }

  return (
    <div ref={ref} className="hide-mobile" style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-btn cart-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span className="cart-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Unread notifications"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 60,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 14,
            boxShadow: "var(--shadow)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <strong style={{ fontSize: 13 }}>
              Notifications{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </strong>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                style={{
                  color: "var(--teal)",
                  background: "none",
                  border: 0,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {isLoading ? (
              <p style={{ padding: 18, color: "var(--muted)", fontSize: 12 }}>Loading…</p>
            ) : isError ? (
              <p style={{ padding: 18, color: "var(--muted)", fontSize: 12 }}>
                Couldn&apos;t load notifications.{" "}
                <button
                  type="button"
                  onClick={() => void refetch()}
                  style={{
                    color: "var(--teal)",
                    background: "none",
                    border: 0,
                    fontWeight: 700,
                  }}
                >
                  Try again
                </button>
              </p>
            ) : unread.length === 0 ? (
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  gap: 6,
                  padding: "26px 18px",
                  color: "var(--muted)",
                }}
              >
                <Icon name="check" size={22} />
                <span style={{ fontSize: 12 }}>You&apos;re all caught up.</span>
              </div>
            ) : (
              unread.slice(0, 10).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  role="menuitem"
                  onClick={() => openNotification(notification)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr",
                    gap: 10,
                    width: "100%",
                    padding: "11px 14px",
                    textAlign: "left",
                    background: "var(--teal-pale)",
                    border: 0,
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 32,
                      height: 32,
                      color: "var(--teal)",
                      background: "white",
                      borderRadius: 9,
                    }}
                  >
                    <Icon name={notificationIcon(notification)} size={16} />
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    <strong style={{ fontSize: 12, color: "var(--ink)" }}>
                      {notification.title}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notification.message}
                    </span>
                    <small style={{ fontSize: 10, color: "var(--muted)" }}>
                      {timeAgo(notification.created_at)}
                    </small>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            style={{
              width: "100%",
              padding: "11px 14px",
              color: "var(--teal)",
              background: "white",
              border: 0,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
