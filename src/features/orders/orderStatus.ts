export type CanonicalOrderStatus =
  | "order_received"
  | "order_confirmed"
  | "preparing_items"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "pending_payment";

const LEGACY_STATUS_MAP: Record<string, CanonicalOrderStatus> = {
  pending: "order_received",
  pending_id_approval: "order_received",
  accepted: "order_confirmed",
  preparing: "preparing_items",
  ready: "out_for_delivery",
  completed: "delivered",
};

/** Mirrors the old PWA's normalizeStatus() — maps legacy 4-stage order
 * statuses onto the current 5-stage scheme (App\Enums\OrderStatus). */
export function normalizeOrderStatus(status: string): CanonicalOrderStatus {
  if (
    status === "order_received" ||
    status === "order_confirmed" ||
    status === "preparing_items" ||
    status === "out_for_delivery" ||
    status === "delivered" ||
    status === "cancelled" ||
    status === "pending_payment"
  ) {
    return status;
  }
  return LEGACY_STATUS_MAP[status] ?? "order_received";
}

export const ORDER_STATUS_STEPS: CanonicalOrderStatus[] = [
  "order_received",
  "order_confirmed",
  "preparing_items",
  "out_for_delivery",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<CanonicalOrderStatus, string> = {
  order_received: "Order Placed",
  order_confirmed: "Confirmed",
  preparing_items: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending_payment: "Awaiting Payment",
};

/** Mirrors Order::isCustomerCancellable() on the backend exactly. */
export function isOrderCancellable(status: string, paymentMethod: string): boolean {
  if (status === "order_received" || status === "pending") return true;
  return (
    status === "pending_payment" && (paymentMethod === "bpi" || paymentMethod === "qrph")
  );
}

/** A "Cook for Me" bundle's kitchen progress — separate from the whole
 * order's delivery-logistics status (a customer's order can be
 * "preparing_items" overall while their Paluto bundle is still "cooking"). */
export type CookingStatus =
  | "pending"
  | "preparing"
  | "cooking"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered";

export const COOKING_STATUS_STEPS: CookingStatus[] = [
  "pending",
  "preparing",
  "cooking",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
];

export const COOKING_STATUS_LABELS: Record<CookingStatus, string> = {
  pending: "Order Placed",
  preparing: "Preparing",
  cooking: "Cooking",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

/** Matches the gradient-status-* tokens in tailwind.config.ts. */
export const ORDER_STATUS_COLOR_CLASS: Record<CanonicalOrderStatus, string> = {
  order_received: "bg-gradient-status-received",
  order_confirmed: "bg-gradient-status-confirmed",
  preparing_items: "bg-gradient-status-preparing",
  out_for_delivery: "bg-gradient-status-outForDelivery",
  delivered: "bg-gradient-status-delivered",
  cancelled: "bg-gradient-status-cancelled",
  pending_payment: "bg-text-muted",
};
