import { Link } from "react-router-dom";
import { useUnreadCount } from "@/features/notifications/useUnreadCount";

export default function NotificationBell({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <Link
      to="/notifications"
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        variant === "dark"
          ? "text-white hover:bg-white/10"
          : "text-text hover:bg-background"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white shadow-soft">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
