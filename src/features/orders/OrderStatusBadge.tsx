import {
  normalizeOrderStatus,
  ORDER_STATUS_COLOR_CLASS,
  ORDER_STATUS_LABELS,
} from "@/features/orders/orderStatus";

export default function OrderStatusBadge({ status }: { status: string }) {
  const canonical = normalizeOrderStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold text-white shadow-soft ${ORDER_STATUS_COLOR_CLASS[canonical]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white/90" />
      {ORDER_STATUS_LABELS[canonical]}
    </span>
  );
}
