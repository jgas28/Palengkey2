import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Spinner } from "@/components/common/LoadingState";
import { getOrder } from "@/services/api/orders";
import type { Order } from "@/types/order";

interface LocationState {
  order?: Order;
}

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateOrder = (location.state as LocationState | null)?.order;
  const id = Number(orderId);

  // Refresh, or a deep link straight to this page, arrives with no navigation
  // state — fall back to fetching the order by id from the route.
  const { data: fetchedOrder, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !stateOrder && Number.isFinite(id),
  });

  const order = stateOrder ?? fetchedOrder;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-gradient-status-delivered text-white shadow-lifted">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h1 className="text-xl font-bold text-text">Order placed!</h1>
        <p className="mt-1 text-sm text-text-muted">
          Salamat! Your palengke run is on its way.
        </p>
      </div>

      {order ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-6 py-4 shadow-soft">
          <p className="text-sm text-text-muted">
            Order #{order.order_number}
            {order.is_reservation && order.scheduled_delivery_time
              ? ` — scheduled for ${new Date(order.scheduled_delivery_time).toLocaleString()}`
              : ""}
          </p>
          <PriceDisplay amount={Number(order.total_amount)} size="lg" />
        </div>
      ) : isLoading ? (
        <Spinner />
      ) : (
        <p className="text-sm text-text-muted">
          Your order has been placed successfully.
        </p>
      )}

      <Button variant="solid" onClick={() => navigate("/shop")} className="mt-2">
        Continue shopping
      </Button>
    </div>
  );
}
