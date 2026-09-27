import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import OrderStatusBadge from "@/features/orders/OrderStatusBadge";
import OrderStatusTimeline from "@/features/orders/OrderStatusTimeline";
import CookingStatusTimeline from "@/features/orders/CookingStatusTimeline";
import RiderTrackingCard from "@/features/orders/RiderTrackingCard";
import FeedbackModal from "@/features/orders/FeedbackModal";
import { cancelOrder, downloadInvoice, getOrder } from "@/services/api/orders";
import { openSupportForOrder } from "@/services/api/support";
import { getOrderFeedback } from "@/services/api/feedback";
import { isOrderCancellable, normalizeOrderStatus } from "@/features/orders/orderStatus";
import { useToastStore } from "@/stores/toastStore";

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

  function handleCancel() {
    if (window.confirm("Cancel this order?")) {
      cancelMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-text">Order #{order.order_number}</h1>
          <p className="text-xs text-text-muted">
            {new Date(order.received_at ?? order.created_at).toLocaleString("en-PH")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderStatusTimeline status={order.status} />

      {normalizeOrderStatus(order.status) === "cancelled" && order.cancellation_reason && (
        <p className="rounded-card bg-status-cancelled/10 p-3.5 text-sm font-medium text-status-cancelled">
          Reason: {order.cancellation_reason}
        </p>
      )}

      {isDelivered && order.delivery_photo && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text">Proof of delivery</h2>
          <img
            src={order.delivery_photo}
            alt="Delivery proof"
            className="w-full rounded-card object-cover shadow-soft"
          />
        </section>
      )}

      <RiderTrackingCard order={order} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">Items</h2>
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface px-4 shadow-soft">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-center justify-between py-3 text-sm">
              <span className="text-text">
                {item.item_name}{" "}
                <span className="text-text-muted">
                  × {item.quantity} {item.unit_name}
                </span>
              </span>
              <PriceDisplay amount={Number(item.subtotal)} size="sm" />
            </li>
          ))}
        </ul>
      </section>

      {order.recipeBundles.filter((bundle) => bundle.paluto_stall_id !== null).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text">Paluto orders</h2>
          {order.recipeBundles
            .filter((bundle) => bundle.paluto_stall_id !== null)
            .map((bundle) => (
              <div
                key={bundle.id}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">{bundle.recipe_name}</p>
                    <p className="text-xs text-text-muted">
                      Cooked by {bundle.stall_name} · {bundle.quantity} {bundle.pricing_unit}
                    </p>
                  </div>
                  <PriceDisplay amount={Number(bundle.cooking_fee)} size="sm" />
                </div>
                <CookingStatusTimeline status={bundle.cooking_status} />
              </div>
            ))}
        </section>
      )}

      <section className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 shadow-soft">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <span aria-hidden="true">📍</span> Delivery address
        </h2>
        <p className="text-sm text-text-muted">{order.delivery_address}</p>
        <p className="text-sm text-text-muted">
          {order.contact_name} · {order.contact_phone}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-soft">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Subtotal</span>
          <PriceDisplay amount={Number(order.subtotal)} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Delivery fee</span>
          <PriceDisplay amount={Number(order.delivery_fee)} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Service fee</span>
          <PriceDisplay amount={Number(order.service_fee)} size="sm" />
        </div>
        {Number(order.voucher_discount) > 0 && (
          <div className="flex justify-between text-sm text-status-delivered">
            <span>Voucher discount</span>
            <PriceDisplay amount={-Number(order.voucher_discount)} size="sm" />
          </div>
        )}
        <div className="flex justify-between border-t border-primary-100 pt-2 text-base font-bold text-text">
          <span>Total</span>
          <PriceDisplay amount={Number(order.total_amount)} size="lg" />
        </div>
        <p className="text-xs text-text-muted">
          Payment: {order.payment_method.toUpperCase()} · {order.payment_status}
        </p>
      </section>

      <div className="flex flex-col gap-2">
        {isDelivered && (
          <Button variant="secondary" onClick={() => setFeedbackOpen(true)}>
            {feedback ? `Update your rating (${feedback.rating}★)` : "Rate this order"}
          </Button>
        )}

        <Button
          variant="secondary"
          loading={supportMutation.isPending}
          onClick={() => supportMutation.mutate()}
        >
          Get help with this order
        </Button>

        <Button variant="secondary" loading={downloading} onClick={handleDownloadInvoice}>
          Download invoice
        </Button>

        {isOrderCancellable(order.status, order.payment_method) && (
          <Button
            variant="danger"
            loading={cancelMutation.isPending}
            onClick={handleCancel}
          >
            Cancel order
          </Button>
        )}

        <Button variant="ghost" onClick={() => navigate("/orders")}>
          Back to orders
        </Button>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        orderId={id}
        existingFeedback={feedback ?? null}
      />
    </div>
  );
}
