import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Clock,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import {
  Card,
  EmptyPanel,
  InitialsAvatar,
  SkeletonRows,
  StatusBadge,
} from "@/components/admin/AdminUi";
import { listAdminOrders } from "@/services/api/adminOrders";
import { paymentMethodLabel } from "@/features/orders/paymentMethods";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderStatus, AdminOrderSummary } from "@/types/adminOrder";

type Filter = AdminOrderStatus | "all";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "order_received", label: "New" },
  { value: "order_confirmed", label: "Confirmed" },
  { value: "preparing_items", label: "Shopping" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending_payment", label: "Awaiting payment" },
];

const MANILA = "Asia/Manila";

function peso(amount: number | string): string {
  return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function manilaDay(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: MANILA });
}

/** "Today · 9:00 AM", "Tomorrow · Morning", "Oct 18 · 10:00 AM" (Manila time). */
function fulfillmentLabel(order: AdminOrderSummary): string {
  if (order.status === "delivered") return "Delivered";
  if (order.status === "cancelled") return "Cancelled";

  const when =
    order.is_reservation && order.scheduled_delivery_time
      ? new Date(order.scheduled_delivery_time)
      : new Date(order.created_at);
  const today = manilaDay(new Date());
  const tomorrow = manilaDay(new Date(Date.now() + 86_400_000));
  const day =
    manilaDay(when) === today
      ? "Today"
      : manilaDay(when) === tomorrow
        ? "Tomorrow"
        : when.toLocaleDateString("en-PH", {
            timeZone: MANILA,
            month: "short",
            day: "numeric",
          });
  const time =
    order.is_reservation && order.scheduled_delivery_time
      ? when.toLocaleTimeString("en-PH", {
          timeZone: MANILA,
          hour: "numeric",
          minute: "2-digit",
        })
      : (order.delivery_slot ?? "ASAP");

  return `${day} · ${time}`;
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </span>
        <span className="block truncate text-xs text-slate-400">{hint}</span>
      </span>
    </Card>
  );
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(
    (searchParams.get("status") as Filter | null) ?? "all",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reservationsOnly, setReservationsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Any filter change invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, reservationsOnly]);

  const query = {
    status: filter === "all" ? undefined : filter,
    search: debouncedSearch || undefined,
    reservationsOnly: reservationsOnly || undefined,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["adminOrders", filter, debouncedSearch, reservationsOnly, page],
    queryFn: () => listAdminOrders({ ...query, page }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const active =
    (counts.order_confirmed ?? 0) +
    (counts.preparing_items ?? 0) +
    (counts.out_for_delivery ?? 0);

  /** Downloads every order in the current filter as CSV (up to 1,000). */
  async function exportOrders() {
    setExporting(true);
    try {
      const rows: AdminOrderSummary[] = [];
      for (let next = 1; next <= 50; next += 1) {
        const result = await listAdminOrders({ ...query, page: next });
        rows.push(...result.orders.data);
        if (next >= result.orders.last_page) break;
      }
      const header = [
        "Order #",
        "Placed",
        "Customer",
        "Phone",
        "Email",
        "Market",
        "Status",
        "Payment",
        "Payment status",
        "Order later",
        "Total",
      ];
      const lines = rows.map((order) =>
        [
          order.order_number,
          new Date(order.created_at).toLocaleString("en-PH", { timeZone: MANILA }),
          order.contact_name,
          order.contact_phone,
          order.customer?.email,
          order.market?.name,
          order.status,
          paymentMethodLabel(order.payment_method),
          order.payment_status,
          order.is_reservation ? "Yes" : "No",
          order.total_amount,
        ]
          .map(csvCell)
          .join(","),
      );
      const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\n")], {
        type: "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not export orders.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold text-slate-900">Orders</h2>
          <p className="text-sm text-primary-700">
            Keep every market order moving from confirmation to doorstep.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportOrders()}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-primary-300 hover:text-primary-700 disabled:opacity-60"
        >
          <ArrowRight size={16} /> {exporting ? "Exporting…" : "Export orders"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Bell size={20} />}
          tone="bg-amber-50 text-amber-600"
          label="Needs attention"
          value={String(counts.order_received ?? 0)}
          hint="New orders to confirm"
        />
        <SummaryCard
          icon={<ShoppingBag size={20} />}
          tone="bg-primary-50 text-primary-700"
          label="Active fulfillment"
          value={String(active)}
          hint="Confirmed, shopping or on the way"
        />
        <SummaryCard
          icon={<Clock size={20} />}
          tone="bg-primary-50 text-primary-700"
          label="Order later"
          value={String(data?.summary?.order_later ?? 0)}
          hint="Scheduled deliveries to prepare"
        />
        <SummaryCard
          icon={<Sparkles size={20} />}
          tone="bg-primary-50 text-primary-700"
          label="Today's order value"
          value={peso(data?.summary?.today_value ?? 0)}
          hint="Before refunds"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-x-0.5 border-b border-slate-100 px-3 pt-2">
          {TABS.map((tab) => {
            const count = tab.value === "all" ? total : (counts[tab.value] ?? 0);
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2 text-[13px] font-medium ${
                  active
                    ? "border-primary text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
                <span
                  className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold ${
                    active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-4">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
            <Search size={16} className="text-primary-700" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number, customer, phone, or email"
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={reservationsOnly}
              onChange={(e) => setReservationsOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            Order later only
          </label>
        </div>

        {isError && !data ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <SkeletonRows rows={6} />
        ) : data.orders.data.length === 0 ? (
          <EmptyPanel
            title="No orders here"
            description="No orders match this filter or search."
          />
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Order and customer</th>
                  <th className="px-5 py-3 font-semibold">Fulfillment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.data.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-3">
                        <span className="rounded-xl bg-primary-50 p-0.5">
                          <InitialsAvatar name={order.contact_name} size={36} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-primary-700">
                            {order.order_number}
                          </span>
                          <span className="block truncate font-medium text-slate-800">
                            {order.contact_name}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleTimeString("en-PH", {
                              timeZone: MANILA,
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            · {paymentMethodLabel(order.payment_method)}
                            {order.payment_status === "paid" ? " · Paid" : ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium text-slate-800">
                        {order.market?.name ?? "—"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={13} aria-hidden="true" /> {fulfillmentLabel(order)}
                        {order.rider && ` · ${order.rider.name}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-slate-900">
                          {peso(order.total_amount)}
                        </span>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Open order ${order.order_number}`}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.orders.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
                <span className="text-slate-500">
                  Page {data.orders.current_page} of {data.orders.last_page}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={data.orders.current_page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={data.orders.current_page >= data.orders.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
