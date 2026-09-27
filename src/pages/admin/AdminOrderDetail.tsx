import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import OrderStatusBadge from "@/features/orders/OrderStatusBadge";
import {
  assignAdminOrderRider,
  cancelAdminOrder,
  getAdminOrder,
  listActiveAdminRiders,
  printAdminOrderLabels,
  updateAdminOrderRecipeBundleCookingStatus,
  updateAdminOrderStatus,
} from "@/services/api/adminOrders";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderStatus, CookingStatus } from "@/types/adminOrder";

const COOKING_FORWARD_TRANSITION: Partial<Record<CookingStatus, { status: CookingStatus; label: string }>> = {
  pending: { status: "preparing", label: "Start preparing" },
  preparing: { status: "cooking", label: "Start cooking" },
  cooking: { status: "ready_for_pickup", label: "Mark ready for pickup" },
  ready_for_pickup: { status: "out_for_delivery", label: "Mark out for delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

const COOKING_STATUS_LABELS: Record<CookingStatus, string> = {
  pending: "Order Placed",
  preparing: "Preparing",
  cooking: "Cooking",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const FORWARD_TRANSITION: Partial<Record<AdminOrderStatus, { status: AdminOrderStatus; label: string }>> = {
  pending_payment: { status: "order_received", label: "Mark as paid" },
  order_received: { status: "order_confirmed", label: "Confirm order" },
  order_confirmed: { status: "preparing_items", label: "Start preparing" },
  preparing_items: { status: "out_for_delivery", label: "Mark out for delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

const BACK_TRANSITION: Partial<Record<AdminOrderStatus, { status: AdminOrderStatus; label: string }>> = {
  order_confirmed: { status: "order_received", label: "Revert to received" },
  preparing_items: { status: "order_confirmed", label: "Revert to confirmed" },
  out_for_delivery: { status: "preparing_items", label: "Revert to preparing" },
  delivered: { status: "out_for_delivery", label: "Revert to out for delivery" },
};

const ASSIGNABLE_STATUSES: AdminOrderStatus[] = ["order_received", "order_confirmed", "preparing_items"];
const CANCEL_BLOCKED: AdminOrderStatus[] = ["out_for_delivery", "delivered", "cancelled"];

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRiderPicker, setShowRiderPicker] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminOrder", id],
    queryFn: () => getAdminOrder(id),
  });

  const { data: riders } = useQuery({
    queryKey: ["adminActiveRiders"],
    queryFn: listActiveAdminRiders,
    enabled: showRiderPicker,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["adminOrder", id] });
    void queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: AdminOrderStatus) => updateAdminOrderStatus(id, status),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update status.", "error");
    },
  });

  const cookingStatusMutation = useMutation({
    mutationFn: ({ bundleId, status }: { bundleId: number; status: CookingStatus }) =>
      updateAdminOrderRecipeBundleCookingStatus(id, bundleId, status),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update cooking status.",
        "error",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAdminOrder(id, cancelReason),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
      setShowCancelForm(false);
      setCancelReason("");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not cancel order.", "error");
    },
  });

  const assignRiderMutation = useMutation({
    mutationFn: (riderId: number) => assignAdminOrderRider(id, riderId),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
      setShowRiderPicker(false);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not assign rider.", "error");
    },
  });

  async function handlePrint() {
    setPrinting(true);
    try {
      const blob = await printAdminOrderLabels(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not generate labels.", "error");
    } finally {
      setPrinting(false);
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

  const forward = FORWARD_TRANSITION[order.status];
  const back = BACK_TRANSITION[order.status];
  const canAssignRider = ASSIGNABLE_STATUSES.includes(order.status);
  const canCancel = !CANCEL_BLOCKED.includes(order.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          aria-label="Back to orders"
          className="text-text-muted"
        >
          ←
        </button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold">#{order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <Button variant="secondary" size="sm" loading={printing} onClick={() => void handlePrint()}>
        Print labels
      </Button>

      <div className="rounded-card border border-border p-4">
        <p className="font-medium text-text">{order.contact_name}</p>
        <p className="text-sm text-text-muted">{order.contact_phone}</p>
        {order.customer && <p className="text-sm text-text-muted">{order.customer.email}</p>}
        <p className="mt-2 text-sm text-text">{order.delivery_address}</p>
        {order.is_reservation && order.scheduled_delivery_time && (
          <p className="mt-1 text-xs font-medium text-status-preparing">
            Order later — scheduled {order.scheduled_delivery_time}
          </p>
        )}
        {order.notes && (
          <p className="mt-2 text-sm text-text-muted">
            <span className="font-medium text-text">Instructions:</span> {order.notes}
          </p>
        )}
      </div>

      <div className="rounded-card border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-text">Items</h2>
        <ul className="flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-text">
                  {item.item_quantity}× {item.item_name}
                  {item.unit_name && ` (${item.unit_name})`}
                </p>
                {item.customer_note && (
                  <p className="text-xs text-text-muted">Note: {item.customer_note}</p>
                )}
              </div>
              <span className="text-text">₱{item.subtotal}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span>₱{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Service fee</span>
            <span>₱{order.service_fee}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Delivery fee</span>
            <span>₱{order.delivery_fee}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>VAT</span>
            <span>₱{order.vat}</span>
          </div>
          {Number(order.voucher_discount) > 0 && (
            <div className="flex justify-between text-status-delivered">
              <span>Voucher {order.voucher_code && `(${order.voucher_code})`}</span>
              <span>-₱{order.voucher_discount}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-text">
            <span>Total</span>
            <span>₱{order.total_amount}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {order.payment_method.toUpperCase()} · {order.payment_status}
          {order.payment_reference && ` · Ref: ${order.payment_reference}`}
        </p>
        {order.cashless_payment && (
          <p className="mt-1 text-xs text-text-muted">
            {order.cashless_payment.provider} ({order.cashless_payment.method}) ·{" "}
            {order.cashless_payment.status}
            {order.cashless_payment.reference &&
              ` · Ref: ${order.cashless_payment.reference}`}
          </p>
        )}
      </div>

      {order.recipeBundles.filter((bundle) => bundle.paluto_stall_id !== null).length > 0 && (
        <div className="rounded-card border border-border p-4">
          <h2 className="mb-2 text-sm font-semibold text-text">Paluto orders</h2>
          <ul className="flex flex-col gap-3">
            {order.recipeBundles
              .filter((bundle) => bundle.paluto_stall_id !== null)
              .map((bundle) => {
                const forwardCooking = COOKING_FORWARD_TRANSITION[bundle.cooking_status];
                const isPending =
                  cookingStatusMutation.isPending &&
                  cookingStatusMutation.variables?.bundleId === bundle.id;
                return (
                  <li key={bundle.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text">{bundle.recipe_name}</p>
                        <p className="text-xs text-text-muted">
                          {bundle.stall_name} · {bundle.quantity} {bundle.pricing_unit}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {COOKING_STATUS_LABELS[bundle.cooking_status]}
                      </span>
                    </div>
                    {forwardCooking && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        loading={isPending}
                        onClick={() =>
                          cookingStatusMutation.mutate({
                            bundleId: bundle.id,
                            status: forwardCooking.status,
                          })
                        }
                      >
                        {forwardCooking.label}
                      </Button>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <div className="rounded-card border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-text">Rider</h2>
        {order.rider ? (
          <p className="text-sm text-text">
            {order.rider.name} · {order.rider.phone} · {order.rider.vehicle_type}
          </p>
        ) : (
          <p className="text-sm text-text-muted">No rider assigned yet.</p>
        )}
        {canAssignRider && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => setShowRiderPicker(true)}
          >
            {order.rider ? "Reassign rider" : "Assign rider"}
          </Button>
        )}
      </div>

      <div className="rounded-card border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-text">History</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {(
            [
              ["Placed", order.created_at],
              ["Rider assigned", order.assigned_at],
              ["Confirmed", order.accepted_at],
              ["Prepared", order.prepared_at],
              ["Out for delivery", order.out_for_delivery_at],
              ["Delivered", order.completed_at],
              ["Cancelled", order.cancelled_at],
            ] as const
          )
            .filter(([, at]) => at)
            .map(([label, at]) => (
              <li key={label} className="flex justify-between text-text-muted">
                <span>{label}</span>
                <span>{new Date(at!).toLocaleString("en-PH")}</span>
              </li>
            ))}
        </ul>
      </div>

      {order.status === "cancelled" && order.cancellation_reason && (
        <div className="rounded-card border border-status-cancelled/30 bg-status-cancelled/5 p-4">
          <p className="text-sm font-medium text-status-cancelled">Cancelled</p>
          <p className="text-sm text-text-muted">{order.cancellation_reason}</p>
        </div>
      )}

      {!showCancelForm ? (
        <div className="flex flex-wrap gap-3">
          {forward && (
            <Button
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(forward.status)}
            >
              {forward.label}
            </Button>
          )}
          {back && (
            <Button
              variant="secondary"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(back.status)}
            >
              {back.label}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setShowCancelForm(true)}>
              Cancel order
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-card border border-border p-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Cancellation reason
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              minLength={5}
              maxLength={500}
              placeholder="Explain why this order is being cancelled."
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <div className="flex gap-3">
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              disabled={cancelReason.trim().length < 5}
              onClick={() => cancelMutation.mutate()}
            >
              Confirm cancellation
            </Button>
            <Button variant="secondary" onClick={() => setShowCancelForm(false)}>
              Back
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={showRiderPicker} onClose={() => setShowRiderPicker(false)} title="Assign rider">
        {!riders && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        {riders && riders.length === 0 && (
          <p className="text-sm text-text-muted">No active riders available.</p>
        )}
        {riders && riders.length > 0 && (
          <ul className="flex flex-col gap-2">
            {riders.map((rider) => (
              <li key={rider.id}>
                <button
                  type="button"
                  onClick={() => assignRiderMutation.mutate(rider.id)}
                  disabled={assignRiderMutation.isPending}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-primary-50 disabled:opacity-50"
                >
                  <span className="text-text">{rider.name}</span>
                  <span className="text-xs text-text-muted">
                    {rider.phone} · {rider.vehicle_type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
