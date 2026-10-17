import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/admin/AdminUi";
import type React from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  History,
  Printer,
  Receipt,
  ShieldCheck,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import {
  assignAdminOrderRider,
  assignAdminOrderShopper,
  cancelAdminOrder,
  getAdminOrder,
  listActiveAdminRiders,
  printAdminOrderLabels,
  updateAdminOrderRecipeBundleCookingStatus,
  updateAdminOrderStatus,
  listActiveAdminShoppers,
} from "@/services/api/adminOrders";
import { useToastStore } from "@/stores/toastStore";
import type {
  AdminOrderItem,
  AdminOrderRecipeBundle,
  AdminOrderStatus,
  CookingStatus,
} from "@/types/adminOrder";
import { paymentMethodLabel } from "@/features/orders/paymentMethods";
import VendorPriceEditor from "@/features/admin/VendorPriceEditor";
import OrderItemEditor from "@/features/admin/OrderItemEditor";
import OrderItemsPanel from "@/features/admin/OrderItemsPanel";
import { vendorSavings } from "@/features/admin/vendorSavings";

/** Trims a decimal quantity like "1.200" to "1.2". */
function formatQty(value: string): string {
  return Number(Number(value).toFixed(3)).toString();
}

/** The shopper's buy list for one recipe bundle — exactly the lines to purchase at the market. */
function BundleBuyList({
  orderId,
  items,
  editable,
  isPaid,
}: {
  orderId: number;
  items: AdminOrderItem[];
  editable: boolean;
  isPaid: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Nothing to buy — the stall supplies everything.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg bg-background px-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="text-text">
            <span className="font-semibold">
              {formatQty(item.quantity)}
              {item.unit_name && ` ${item.unit_name}`}
            </span>{" "}
            {item.item_name}
            {item.customer_note && (
              <span className="block text-xs text-text-muted">
                Note: {item.customer_note}
              </span>
            )}
            <VendorPriceEditor orderId={orderId} item={item} />
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1 self-start">
            <span className="text-text-muted">₱{item.subtotal}</span>
            {editable && (
              <OrderItemEditor orderId={orderId} item={item} isPaid={isPaid} />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const COOKING_FORWARD_TRANSITION: Partial<
  Record<CookingStatus, { status: CookingStatus; label: string }>
> = {
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

const FORWARD_TRANSITION: Partial<
  Record<AdminOrderStatus, { status: AdminOrderStatus; label: string }>
> = {
  pending_payment: { status: "order_received", label: "Mark as paid" },
  order_received: { status: "order_confirmed", label: "Confirm order" },
  order_confirmed: { status: "preparing_items", label: "Start preparing" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

const BACK_TRANSITION: Partial<
  Record<AdminOrderStatus, { status: AdminOrderStatus; label: string }>
> = {
  order_confirmed: { status: "order_received", label: "Revert to received" },
  preparing_items: { status: "order_confirmed", label: "Revert to confirmed" },
  out_for_delivery: { status: "preparing_items", label: "Revert to preparing" },
  delivered: { status: "out_for_delivery", label: "Revert to out for delivery" },
};

/** Riders are assigned while preparing; the rider app then marks it out for delivery. */
const ASSIGNABLE_STATUSES: AdminOrderStatus[] = ["preparing_items"];
const CANCEL_BLOCKED: AdminOrderStatus[] = ["out_for_delivery", "delivered", "cancelled"];

function SectionHeader({
  icon,
  title,
  subtitle,
  aside,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  aside?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {aside && <span className="text-xs text-slate-500">{aside}</span>}
    </div>
  );
}

const fulfillmentSelect =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500";

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [printing, setPrinting] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminOrder", id],
    queryFn: () => getAdminOrder(id),
  });

  const { data: riders } = useQuery({
    queryKey: ["adminActiveRiders"],
    queryFn: listActiveAdminRiders,
  });

  const shopperMarketId = order?.market?.id;
  const { data: shoppers } = useQuery({
    queryKey: ["adminActiveShoppers", shopperMarketId ?? null],
    queryFn: () => listActiveAdminShoppers(shopperMarketId),
    enabled: !!order,
  });

  const assignShopperMutation = useMutation({
    mutationFn: (shopperId: number | null) => assignAdminOrderShopper(id, shopperId),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not assign shopper.",
        "error",
      );
    },
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
      showToast(
        error instanceof Error ? error.message : "Could not update status.",
        "error",
      );
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
      showToast(
        error instanceof Error ? error.message : "Could not cancel order.",
        "error",
      );
    },
  });

  const assignRiderMutation = useMutation({
    mutationFn: (riderId: number) => assignAdminOrderRider(id, riderId),
    onSuccess: (data) => {
      invalidate();
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not assign rider.",
        "error",
      );
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
      showToast(
        error instanceof Error ? error.message : "Could not generate labels.",
        "error",
      );
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

  // Recipe/dish ingredient lines belong under their bundle's buy list, not the flat item list.
  const standaloneItems = order.items.filter(
    (item) => item.order_recipe_bundle_id === null,
  );
  const stallBundles = (order.recipe_bundles ?? []).filter(
    (bundle) => bundle.paluto_stall_id !== null,
  );
  const rawBundles = (order.recipe_bundles ?? []).filter(
    (bundle) => bundle.paluto_stall_id === null,
  );
  const itemsForBundle = (bundle: AdminOrderRecipeBundle) =>
    order.items.filter((item) => item.order_recipe_bundle_id === bundle.id);
  const canCancel = !CANCEL_BLOCKED.includes(order.status);
  // Same rule as the API: lines can change until the order leaves the market.
  const itemsEditable = [
    "pending_payment",
    "order_received",
    "order_confirmed",
    "preparing_items",
  ].includes(order.status);
  const isPaid = order.payment_status === "paid";
  const recordedSavings = order.items
    .map(vendorSavings)
    .filter((value): value is number => value !== null);
  const vendorSavingsTotal = recordedSavings.length
    ? recordedSavings.reduce((sum, value) => sum + value, 0)
    : null;

  const STEPS: { label: string; at: string | null }[] = [
    { label: "Placed", at: order.created_at },
    { label: "Confirmed", at: order.accepted_at },
    { label: "Shopping", at: order.prepared_at },
    { label: "Out for delivery", at: order.out_for_delivery_at },
    { label: "Delivered", at: order.completed_at },
  ];
  const STEP_STATUSES: AdminOrderStatus[] = [
    "order_received",
    "order_confirmed",
    "preparing_items",
    "out_for_delivery",
    "delivered",
  ];
  const currentStep = Math.max(0, STEP_STATUSES.indexOf(order.status));
  const manilaTime = (iso: string, withDay = false) =>
    new Date(iso).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      ...(withDay ? { weekday: "short", month: "short", day: "numeric" } : {}),
      hour: "numeric",
      minute: "2-digit",
    });
  const deliveryWindow =
    order.is_reservation && order.scheduled_delivery_time
      ? manilaTime(order.scheduled_delivery_time, true)
      : (order.delivery_slot ?? "As soon as possible");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mb-3 flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to orders
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-700">
              Order {order.order_number}
              <StatusBadge status={order.status} />
              {order.is_reservation && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Order later
                </span>
              )}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">
              {order.contact_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Placed {manilaTime(order.created_at, true)}
              {order.market?.name && ` · ${order.market.name}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={printing}
              onClick={() => void handlePrint()}
            >
              <Printer size={16} className="mr-1.5" aria-hidden="true" /> Print labels
            </Button>
            {forward && (
              <Button
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate(forward.status)}
              >
                <Check size={16} className="mr-1.5" aria-hidden="true" /> {forward.label}
              </Button>
            )}
          </div>
        </div>
      </div>

      {order.status !== "cancelled" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <ol className="flex min-w-[560px] items-start">
            {STEPS.map((step, index) => {
              const done = index <= currentStep;
              const active = index === currentStep && order.status !== "delivered";
              return (
                <li
                  key={step.label}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {index > 0 && (
                    <span
                      className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                        index <= currentStep ? "bg-primary" : "bg-slate-200"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-semibold ${
                      done
                        ? "border-primary bg-primary text-white"
                        : active
                          ? "border-primary bg-white text-primary ring-4 ring-primary-100"
                          : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {done ? <Check size={15} /> : index + 1}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-slate-800">
                    {step.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {step.at ? manilaTime(step.at) : active ? "In progress" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Order cancelled</p>
          {order.cancellation_reason && (
            <p className="text-sm text-rose-700/80">{order.cancellation_reason}</p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={<ShieldCheck size={18} />}
              title="Customer & delivery"
              subtitle="Contact and handoff information"
            />
            <div className="grid gap-5 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Customer
                </p>
                <p className="mt-2 font-semibold text-slate-900">{order.contact_name}</p>
                <p className="text-sm text-slate-500">{order.contact_phone}</p>
                {order.customer && (
                  <p className="text-sm text-slate-500">{order.customer.email}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Delivery address
                </p>
                <p className="mt-2 text-sm text-slate-700">{order.delivery_address}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Delivery window
                </p>
                <p className="mt-2 font-semibold text-slate-900">{deliveryWindow}</p>
                <p className="text-sm text-slate-500">
                  {order.is_reservation ? "Scheduled (order later)" : "Same-day delivery"}
                </p>
              </div>
            </div>
            {order.notes && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <span className="font-semibold">Instructions:</span> {order.notes}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={<ShoppingBasket size={18} />}
              title="Order items"
              subtitle={`${order.items.length} item${order.items.length === 1 ? "" : "s"}${
                order.market?.name ? ` from ${order.market.name}` : ""
              }`}
              aside={itemsEditable ? "Changes update totals instantly" : undefined}
            />
            <div className="pt-3">
              <OrderItemsPanel
                orderId={order.id}
                items={standaloneItems}
                editable={itemsEditable}
                isPaid={isPaid}
              />
            </div>
          </section>

          {stallBundles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Paluto — buy for the stall
              </h2>
              <p className="mb-3 text-xs text-text-muted">
                Buy these at the market and hand them to the stall to cook. Items the
                stall supplies itself aren&apos;t listed.
              </p>
              <ul className="flex flex-col gap-3">
                {stallBundles.map((bundle) => {
                  const forwardCooking =
                    COOKING_FORWARD_TRANSITION[bundle.cooking_status];
                  const isPending =
                    cookingStatusMutation.isPending &&
                    cookingStatusMutation.variables?.bundleId === bundle.id;
                  return (
                    <li
                      key={bundle.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-text">
                            {bundle.recipe_name} · {formatQty(bundle.quantity)}{" "}
                            {bundle.pricing_unit}
                          </p>
                          <p className="text-xs text-text-muted">
                            Deliver to {bundle.stall_name}
                            {bundle.stall?.contact_phone &&
                              ` · ${bundle.stall.contact_phone}`}
                            {" · "}cooking fee ₱{bundle.cooking_fee}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-primary">
                          {COOKING_STATUS_LABELS[bundle.cooking_status]}
                        </span>
                      </div>
                      <BundleBuyList
                        orderId={order.id}
                        items={itemsForBundle(bundle)}
                        editable={itemsEditable}
                        isPaid={isPaid}
                      />
                      {forwardCooking && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="self-start"
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

          {rawBundles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Recipe ingredients
              </h2>
              <p className="mb-3 text-xs text-text-muted">
                Raw ingredients for the customer to cook — deliver with the rest of the
                order.
              </p>
              <ul className="flex flex-col gap-3">
                {rawBundles.map((bundle) => (
                  <li
                    key={bundle.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium text-text">
                      {bundle.recipe_name} · {formatQty(bundle.quantity)}{" "}
                      {bundle.pricing_unit}
                    </p>
                    <BundleBuyList
                      orderId={order.id}
                      items={itemsForBundle(bundle)}
                      editable={itemsEditable}
                      isPaid={isPaid}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={<History size={18} />}
              title="Order history"
              subtitle="A clear audit trail for the operations team"
            />
            <ol className="flex flex-col gap-4 pt-4">
              {(
                [
                  [
                    "Order placed",
                    order.created_at,
                    `Customer checked out using ${paymentMethodLabel(order.payment_method)}.`,
                  ],
                  [
                    "Rider assigned",
                    order.assigned_at,
                    order.rider ? `${order.rider.name} will deliver this order.` : "",
                  ],
                  [
                    "Order confirmed",
                    order.accepted_at,
                    "The market accepted the order.",
                  ],
                  [
                    "Items prepared",
                    order.prepared_at,
                    "Shopping finished and items are packed.",
                  ],
                  [
                    "Out for delivery",
                    order.out_for_delivery_at,
                    "The rider picked up the order.",
                  ],
                  ["Delivered", order.completed_at, "The customer received the order."],
                  ["Cancelled", order.cancelled_at, order.cancellation_reason ?? ""],
                ] as const
              )
                .filter(([, at]) => at)
                .map(([label, at, note]) => (
                  <li key={label} className="flex gap-3">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                        label === "Cancelled" ? "bg-rose-500" : "bg-primary"
                      }`}
                    >
                      <Check size={14} />
                    </span>
                    <div className="flex flex-1 flex-wrap justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        {note && <p className="text-xs text-slate-500">{note}</p>}
                      </div>
                      <span className="text-xs text-slate-400">
                        {manilaTime(at!, true)}
                      </span>
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={<Receipt size={18} />}
              title="Payment summary"
              subtitle={`${paymentMethodLabel(order.payment_method)} · ${order.payment_status}`}
            />
            <div className="pt-4">
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₱{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service fee</span>
                  <span>₱{order.service_fee}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee</span>
                  <span>₱{order.delivery_fee}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT</span>
                  <span>₱{order.vat}</span>
                </div>
                {Number(order.bulk_delivery_subsidy ?? 0) > 0 && (
                  <div className="flex justify-between text-status-delivered">
                    <span>Bulk delivery subsidy (BULK-FREESHIP-49)</span>
                    <span>-₱{order.bulk_delivery_subsidy}</span>
                  </div>
                )}
                {vendorSavingsTotal !== null && (
                  <div className="flex justify-between text-slate-500">
                    <span>Vendor haggle savings (admin only)</span>
                    <span>₱{vendorSavingsTotal.toFixed(2)}</span>
                  </div>
                )}
                {Number(order.bulk_discount ?? 0) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Bulk wholesale savings (in item prices)</span>
                    <span>₱{order.bulk_discount}</span>
                  </div>
                )}
                {Number(order.voucher_discount) > 0 && (
                  <div className="flex justify-between text-status-delivered">
                    <span>Voucher {order.voucher_code && `(${order.voucher_code})`}</span>
                    <span>-₱{order.voucher_discount}</span>
                  </div>
                )}
                <div className="mt-1 flex items-end justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-display text-2xl font-bold text-slate-900">
                    ₱
                    {Number(order.total_amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {paymentMethodLabel(order.payment_method)} · {order.payment_status}
                {order.payment_reference && ` · Ref: ${order.payment_reference}`}
              </p>
              {order.cashless_payment && (
                <p className="mt-1 text-xs text-slate-500">
                  {order.cashless_payment.provider} ({order.cashless_payment.method}) ·{" "}
                  {order.cashless_payment.status}
                  {order.cashless_payment.reference &&
                    ` · Ref: ${order.cashless_payment.reference}`}
                </p>
              )}
            </div>
            <p
              className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <Check size={14} aria-hidden="true" />
              {isPaid
                ? "Payment received"
                : order.payment_method === "cod"
                  ? "Collect payment upon delivery"
                  : "Waiting for payment"}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={<Truck size={18} />}
              title="Fulfillment"
              subtitle="Shopper and rider assignment"
            />
            <div className="flex flex-col gap-4 pt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Assigned shopper
                </span>
                <select
                  value={order.shopper?.id ?? ""}
                  disabled={
                    assignShopperMutation.isPending || order.status === "cancelled"
                  }
                  onChange={(e) =>
                    assignShopperMutation.mutate(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className={fulfillmentSelect}
                >
                  <option value="">Unassigned</option>
                  {order.shopper &&
                    !shoppers?.some((s) => s.id === order.shopper?.id) && (
                      <option value={order.shopper.id}>{order.shopper.name}</option>
                    )}
                  {shoppers?.map((shopper) => (
                    <option key={shopper.id} value={shopper.id}>
                      {shopper.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Delivery rider
                </span>
                <select
                  value={order.rider?.id ?? ""}
                  disabled={!canAssignRider || assignRiderMutation.isPending}
                  onChange={(e) =>
                    e.target.value && assignRiderMutation.mutate(Number(e.target.value))
                  }
                  className={fulfillmentSelect}
                >
                  {!order.rider && <option value="">Unassigned</option>}
                  {order.rider && !riders?.some((r) => r.id === order.rider?.id) && (
                    <option value={order.rider.id}>{order.rider.name}</option>
                  )}
                  {riders?.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} · {rider.vehicle_type}
                    </option>
                  ))}
                </select>
                {!canAssignRider &&
                  ["order_received", "order_confirmed"].includes(order.status) && (
                    <span className="mt-1 block text-xs text-slate-500">
                      You can assign a rider once shopping starts.
                    </span>
                  )}
                {order.status === "preparing_items" && order.rider && (
                  <span className="mt-1 block text-xs text-slate-500">
                    The rider marks it out for delivery from the rider app on pickup.
                  </span>
                )}
              </label>
              <p className="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                <Clock size={14} aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{deliveryWindow}</span>
                  Customer delivery window
                </span>
              </p>
            </div>
          </section>

          {(back || canCancel) && (
            <section className="rounded-2xl bg-[#1d3a3f] p-5 text-white shadow-sm">
              <p className="font-semibold">Order actions</p>
              <p className="mb-4 text-xs text-white/60">
                Changes are recorded in order history.
              </p>
              {!showCancelForm ? (
                <div className="flex flex-col gap-2">
                  {back && (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(back.status)}
                      className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                    >
                      {back.label}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setShowCancelForm(true)}
                      className="rounded-lg border border-[#ef3b18]/70 px-4 py-2 text-sm font-semibold text-white hover:bg-[#ef3b18]/20"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-white">
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
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
