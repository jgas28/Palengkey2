import type { IconName } from "@/components/pk/Icon";
import type { Notification } from "@/types/notification";

/** The design icon for a notification, from its type/order status. */
export function notificationIcon(notification: Notification): IconName {
  const type = `${notification.type} ${notification.order_status ?? ""}`.toLowerCase();
  if (type.includes("deliver") || type.includes("rider")) return "truck";
  if (type.includes("promo") || type.includes("voucher") || type.includes("deal"))
    return "sparkle";
  if (type.includes("payment") || type.includes("verif") || type.includes("id_"))
    return "shield";
  if (type.includes("support") || type.includes("message") || type.includes("chat"))
    return "message";
  return "bag";
}

/**
 * Where tapping a notification goes: its own in-app link if it has one, else the
 * order it's about, else a page that matches its type. Null = nowhere specific.
 */
export function notificationTarget(notification: Notification): string | null {
  const url = notification.action_url?.trim();
  if (url) {
    // Only follow in-app paths (or our own absolute URLs) — never off-site links.
    if (url.startsWith("/")) return url;
    try {
      const parsed = new URL(url);
      if (parsed.origin === window.location.origin)
        return `${parsed.pathname}${parsed.search}`;
    } catch {
      // Not a URL — fall through to the type-based target.
    }
  }

  if (notification.order_id) return `/orders/${notification.order_id}`;

  const type = notification.type.toLowerCase();
  if (type.includes("voucher") || type.includes("promo") || type.includes("deal"))
    return "/vouchers";
  if (type.includes("support") || type.includes("message") || type.includes("chat"))
    return "/support";
  if (type.includes("verif") || type.includes("id_") || type.includes("account"))
    return "/profile";
  return null;
}

/** "5m ago" style time for compact lists. */
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}
