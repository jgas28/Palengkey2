import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { getOrder } from "@/services/api/orders";
import { formatPeso } from "@/utils/currency";
import type { Order } from "@/types/order";

interface LocationState {
  order?: Order;
}

/** The design's "Salamat!" order confirmation. */
export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateOrder = (location.state as LocationState | null)?.order;
  const id = Number(orderId);

  // Refresh, or a deep link straight to this page, arrives with no navigation
  // state — fall back to fetching the order by id from the route.
  const { data: fetchedOrder } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !stateOrder && Number.isFinite(id),
  });

  const order = stateOrder ?? fetchedOrder;
  const firstName = order?.contact_name?.split(" ")[0];
  const delivery =
    order?.is_reservation && order.scheduled_delivery_time
      ? new Date(order.scheduled_delivery_time).toLocaleString("en-PH", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Today";

  return (
    <main className="inner-page account-bg">
      <section className="confirmation shell">
        <span>
          <Icon name="check" size={38} />
        </span>
        <p className="kicker">Order confirmed</p>
        <h1>Salamat{firstName ? `, ${firstName}` : ""}!</h1>
        <p>
          Your market shopper is getting ready. We’ll notify you when they start picking your fresh
          items.
        </p>
        <div>
          <small>Order number</small>
          <small>Estimated delivery</small>
          <strong>{order?.order_number ?? "—"}</strong>
          <strong>{delivery}</strong>
          {order && (
            <>
              <small>Total</small>
              <small>Payment</small>
              <strong>{formatPeso(Number(order.total_amount))}</strong>
              <strong style={{ textTransform: "capitalize" }}>{order.payment_status}</strong>
            </>
          )}
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => navigate(order ? `/orders/${order.id}` : "/orders")}
        >
          Track your order <Icon name="arrow" />
        </button>
        <button type="button" onClick={() => navigate("/shop")}>
          Back to shopping
        </button>
      </section>
    </main>
  );
}
