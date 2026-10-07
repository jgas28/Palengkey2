import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { getRiderLocation } from "@/services/api/riderTracking";
import { calculateDistanceKm } from "@/utils/distance";
import { formatPeso } from "@/utils/currency";
import FeedbackModal from "@/features/orders/FeedbackModal";
import { cancelOrder, downloadInvoice, getOrder } from "@/services/api/orders";
import { openSupportForOrder } from "@/services/api/support";
import { getOrderFeedback } from "@/services/api/feedback";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  isOrderCancellable,
  normalizeOrderStatus,
  statusClass,
  statusStyle,
} from "@/features/orders/orderStatus";
import { useToastStore } from "@/stores/toastStore";
import { paymentMethodLabel } from "@/features/orders/paymentMethods";

const COOKING_LABELS: Record<string, string> = {
  pending: "Order placed",
  preparing: "Preparing",
  cooking: "Cooking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

/** The design's order tracking page, on the live order (polled until delivered/cancelled). */
export default function OrderDetailView() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [downloading, setDownloading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 10000;
      const normalized = normalizeOrderStatus(status);
      return normalized === "delivered" || normalized === "cancelled" ? false : 10000;
    },
  });

  const isDelivered = order ? normalizeOrderStatus(order.status) === "delivered" : false;

  const { data: feedback } = useQuery({
    queryKey: ["orderFeedback", id],
    queryFn: () => getOrderFeedback(id),
    enabled: isDelivered,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: ({ message }) => {
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast(message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not cancel order.",
        "error",
      );
    },
  });

  const supportMutation = useMutation({
    mutationFn: () => openSupportForOrder(order!.order_number),
    onSuccess: (thread) => navigate(`/support/${thread.id}`),
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not start a conversation.",
        "error",
      );
    },
  });

  async function handleDownloadInvoice() {
    setDownloading(true);
    try {
      const blob = await downloadInvoice(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Palengkey_Invoice_${order?.order_number ?? id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download invoice.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  }

  const isRiderLive = order ? normalizeOrderStatus(order.status) === "out_for_delivery" : false;
  const { data: riderLocation } = useQuery({
    queryKey: ["riderLocation", id],
    queryFn: () => getRiderLocation(id),
    refetchInterval: 8000,
    enabled: isRiderLive && Boolean(order?.rider),
  });
  const riderDistance =
    riderLocation && order
      ? `About ${calculateDistanceKm(riderLocation.latitude, riderLocation.longitude, order.latitude, order.longitude).toFixed(1)} km away`
      : (order?.rider?.phone ?? "");

  function handleCancel() {
    if (window.confirm("Cancel this order?")) {
      cancelMutation.mutate();
    }
  }

  if (isLoading || isError || !order) {
    return (
      <main className="inner-page account-bg">
        <div className="shell page-title">
          <h1>{isLoading ? "Loading your order…" : "Something went wrong"}</h1>
          {!isLoading && (
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  const canonical = normalizeOrderStatus(order.status);
  const currentIndex = canonical === "pending_payment" ? -1 : ORDER_STATUS_STEPS.indexOf(canonical);
  const isCancelled = canonical === "cancelled";
  const isOutForDelivery = canonical === "out_for_delivery";
  const headline = isCancelled
    ? "Order cancelled"
    : canonical === "pending_payment"
      ? "Waiting for your payment"
      : canonical === "delivered"
        ? "Order delivered"
        : canonical === "out_for_delivery"
          ? "Your order is on the way"
          : canonical === "preparing_items"
            ? "Your shopper is at the market"
            : "We got your order";
  const subline = isCancelled
    ? (order.cancellation_reason ?? "This order was cancelled.")
    : canonical === "delivered"
      ? "This market run was completed successfully."
      : order.is_reservation && order.scheduled_delivery_time
        ? `Scheduled for ${new Date(order.scheduled_delivery_time).toLocaleString("en-PH")}`
        : "We'll keep this page updated as your order moves along.";
  const STEP_DETAIL: Record<string, string> = {
    order_received: "We received your market list.",
    order_confirmed: "Your order was confirmed.",
    preparing_items: "Fresh items are being selected now.",
    out_for_delivery: "Your rider is bringing the order to you.",
    delivered: "Order received at your doorstep.",
  };
  const palutoBundles = order.recipeBundles.filter((bundle) => bundle.paluto_stall_id !== null);

  return (
    <main className="inner-page account-bg">
      <div className="shell tracking-head">
        <button type="button" onClick={() => navigate("/orders")}>
          <Icon name="arrow" size={17} /> All orders
        </button>
        <div>
          <p className="kicker">Order {order.order_number}</p>
          <h1>{headline}</h1>
          <p>{subline}</p>
        </div>
        <span className={`status ${statusClass(order.status)}`} style={statusStyle(order.status)}>
          {ORDER_STATUS_LABELS[canonical]}
        </span>
      </div>

      <div className="shell tracking-layout">
        <section className="tracking-main">
          <div className="tracking-map">
            <span className="road road-one"></span>
            <span className="road road-two"></span>
            <span className="road road-three"></span>
            <div className="map-market">
              <Icon name="bag" />
              <small>Market</small>
            </div>
            <div className="map-route">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div className="map-home">
              <Icon name="truck" />
              <small>Your home</small>
            </div>
            <div className="eta-card">
              <small>{canonical === "delivered" ? "Delivered" : "Status"}</small>
              <strong>{ORDER_STATUS_LABELS[canonical]}</strong>
              {order.distance_meters ? (
                <span>
                  <Icon name="truck" size={14} /> {(order.distance_meters / 1000).toFixed(1)} km from the market
                </span>
              ) : null}
            </div>
          </div>

          {order.rider && (
            <article className="rider-card">
              <span>{order.rider.name.charAt(0).toUpperCase()}</span>
              <div>
                <small>{isOutForDelivery ? "Your rider is on the way" : "Your rider"}</small>
                <strong>{order.rider.name}</strong>
                <p>{riderDistance}</p>
              </div>
              <a className="btn" href={`tel:${order.rider.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 11px", color: "var(--teal-dark)", background: "var(--teal-pale)", borderRadius: 9, fontSize: 9, fontWeight: 700 }}>
                <Icon name="message" size={17} /> Call rider
              </a>
            </article>
          )}

          {canonical === "delivered" && order.delivery_photo && (
            <article className="tracking-items">
              <div className="tracking-section-title">
                <h2>Proof of delivery</h2>
              </div>
              <img src={order.delivery_photo} alt="Delivery proof" style={{ height: "auto" }} />
            </article>
          )}

          <article className="tracking-items">
            <div className="tracking-section-title">
              <h2>Order items</h2>
              <span>
                {order.items.length} item{order.items.length === 1 ? "" : "s"}
              </span>
            </div>
            {order.items.map((item, index) => (
              <div className="tracked-item" key={index}>
                <span>
                  <Icon name="leaf" />
                </span>
                <div>
                  <strong>{item.item_name}</strong>
                  <small>
                    {Number(item.quantity)} {item.unit_name}
                  </small>
                </div>
                <b>{formatPeso(Number(item.subtotal))}</b>
              </div>
            ))}
            {palutoBundles.map((bundle) => (
              <div className="tracked-item" key={`bundle-${bundle.id}`}>
                <span>
                  <Icon name="sparkle" />
                </span>
                <div>
                  <strong>
                    {bundle.recipe_name} · cooked by {bundle.stall_name}
                  </strong>
                  <small>
                    {Number(bundle.quantity)} {bundle.pricing_unit} · {COOKING_LABELS[bundle.cooking_status] ?? bundle.cooking_status}
                  </small>
                </div>
                <b>{formatPeso(Number(bundle.cooking_fee))} fee</b>
              </div>
            ))}
            <div className="tracking-totals">
              <p>
                <span>Subtotal</span>
                <strong>{formatPeso(Number(order.subtotal))}</strong>
              </p>
              <p>
                <span>Service fee</span>
                <strong>{formatPeso(Number(order.service_fee))}</strong>
              </p>
              <p>
                <span>Delivery fee (incl. VAT)</span>
                <strong>{formatPeso(Number(order.delivery_fee) + Number(order.vat ?? 0))}</strong>
              </p>
              {Number(order.bulk_delivery_subsidy ?? 0) > 0 && (
                <p>
                  <span>Bulk delivery subsidy (BULK-FREESHIP-49)</span>
                  <strong>-{formatPeso(Number(order.bulk_delivery_subsidy))}</strong>
                </p>
              )}
              {Number(order.voucher_discount) > 0 && (
                <p>
                  <span>Voucher discount{order.voucher_code ? ` (${order.voucher_code})` : ""}</span>
                  <strong>-{formatPeso(Number(order.voucher_discount))}</strong>
                </p>
              )}
              {Number(order.bulk_discount ?? 0) > 0 && (
                <p>
                  <span>Bulk wholesale savings (in item prices)</span>
                  <strong>{formatPeso(Number(order.bulk_discount))}</strong>
                </p>
              )}
              <p>
                <span>
                  Total · {paymentMethodLabel(order.payment_method)} · {order.payment_status}
                </span>
                <strong>{formatPeso(Number(order.total_amount))}</strong>
              </p>
            </div>
          </article>
        </section>

        <aside className="tracking-timeline">
          <h2>Order progress</h2>
          {isCancelled ? (
            <div className="done">
              <span style={{ background: "#dc2626" }}>
                <Icon name="x" size={14} />
              </span>
              <section>
                <strong>Cancelled</strong>
                <p>{order.cancellation_reason ?? "This order was cancelled."}</p>
              </section>
            </div>
          ) : (
            ORDER_STATUS_STEPS.map((step, index) => {
              const done = index <= currentIndex;
              const current = index === currentIndex;
              return (
                <div className={`${done ? "done" : ""} ${current ? "current" : ""}`} key={step}>
                  <span>{done ? <Icon name="check" size={14} /> : ""}</span>
                  <section>
                    <strong>{ORDER_STATUS_LABELS[step]}</strong>
                    <p>{STEP_DETAIL[step]}</p>
                    <small>{current ? "In progress" : done ? "Done" : "Up next"}</small>
                  </section>
                </div>
              );
            })
          )}
          <div className="delivery-address">
            <Icon name="truck" />
            <div>
              <small>Delivering to</small>
              <strong>
                {order.contact_name} · {order.contact_phone}
              </strong>
              <p>{order.delivery_address}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn support-order"
            disabled={supportMutation.isPending}
            onClick={() => supportMutation.mutate()}
          >
            Need help with this order?
          </button>
          {isDelivered && (
            <button type="button" className="btn support-order" onClick={() => setFeedbackOpen(true)}>
              {feedback ? `Update your rating (${feedback.rating}★)` : "Rate this order"}
            </button>
          )}
          <button type="button" className="btn support-order" disabled={downloading} onClick={handleDownloadInvoice}>
            {downloading ? "Downloading…" : "Download invoice"}
          </button>
          {isOrderCancellable(order.status, order.payment_method) && (
            <button
              type="button"
              className="btn support-order"
              style={{ color: "#b42318", background: "#fde8e8" }}
              disabled={cancelMutation.isPending}
              onClick={handleCancel}
            >
              Cancel order
            </button>
          )}
        </aside>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        orderId={id}
        existingFeedback={feedback ?? null}
      />
    </main>
  );
}
