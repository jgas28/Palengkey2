import { Link } from "react-router-dom";
import PriceDisplay from "@/components/ui/PriceDisplay";
import OrderStatusBadge from "@/features/orders/OrderStatusBadge";
import type { Order } from "@/types/order";

export default function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4 shadow-soft transition-all duration-150 active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text">#{order.order_number}</p>
          <p className="text-xs text-text-muted">
            {new Date(order.received_at ?? order.created_at).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-sm text-text-muted">{itemCount} item(s)</span>
        <PriceDisplay amount={Number(order.total_amount)} size="sm" />
      </div>
    </Link>
  );
}
