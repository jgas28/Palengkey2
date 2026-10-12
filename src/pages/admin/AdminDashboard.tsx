import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import {
  Card,
  EmptyPanel,
  InitialsAvatar,
  SkeletonRows,
  StatusBadge,
} from "@/components/admin/AdminUi";
import { getAdminDashboard, getDashboardOrders } from "@/services/api/adminDashboard";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import type { DashboardPeriod, OverviewMetric } from "@/types/adminDashboard";

type Period = DashboardPeriod;

const PERIODS: { value: Period; label: string; summary: string; versus: string }[] = [
  { value: 0, label: "Today", summary: "today", versus: "vs yesterday" },
  {
    value: 1,
    label: "Last 24 hours",
    summary: "in the last 24 hours",
    versus: "vs previous 24h",
  },
  {
    value: 7,
    label: "Last 7 days",
    summary: "in the last 7 days",
    versus: "vs previous 7 days",
  },
  {
    value: 30,
    label: "Last 30 days",
    summary: "in the last 30 days",
    versus: "vs previous 30 days",
  },
  {
    value: 90,
    label: "Last 90 days",
    summary: "in the last 90 days",
    versus: "vs previous 90 days",
  },
];

function peso(amount: number | string | null | undefined, decimals = 2): string {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Overview KPI card: label + tinted icon, big value, change vs the previous period. */
function StatCard({
  label,
  value,
  metric,
  icon,
  tone,
  to,
  versus = "vs previous period",
}: {
  versus?: string;
  label: string;
  value: string;
  metric?: OverviewMetric;
  icon: ReactNode;
  tone: string;
  to?: string;
}) {
  const up = (metric?.change ?? 0) >= 0;
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {metric && (
        <p className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${
              up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? "+" : ""}
            {metric.change}%
          </span>
          <span className="text-slate-400">{versus}</span>
        </p>
      )}
    </>
  );
  const className =
    "block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all";

  return to ? (
    <Link
      to={to}
      className={`${className} hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Small "count → page" chips for the queues that need attention. */
function QueueChip({ label, count, to }: { label: string; count: number; to?: string }) {
  const className =
    "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm";
  const body = (
    <>
      <span className="text-slate-600">{label}</span>
      <span className="flex items-center gap-1 font-semibold text-slate-900">
        {count.toLocaleString("en-PH")}
        {to && <ChevronRight size={14} className="text-slate-400" />}
      </span>
    </>
  );

  return to ? (
    <Link
      to={to}
      className={`${className} transition-colors hover:border-primary-300 hover:bg-primary-50/40`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Page buttons around the current page, e.g. 1 … 4 5 6 … 12 (null = gap). */
function pageNumbers(current: number, last: number): (number | null)[] {
  const pages = new Set(
    [1, last, current - 1, current, current + 1].filter((n) => n >= 1 && n <= last),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);
  // Default: what's happening today.
  const [days, setDays] = useState<Period>(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const period = PERIODS.find((option) => option.value === days) ?? PERIODS[0];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["adminDashboard", days],
    queryFn: () => getAdminDashboard(days),
    placeholderData: keepPreviousData,
  });

  // Newest orders first, paginated, in the same period as the cards.
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["adminDashboardOrders", days, ordersPage],
    queryFn: () => getDashboardOrders(days, ordersPage),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const overview = data?.overview;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">
            Revenue, orders and customer activity
            {data?.scope === "market" && user?.market_name
              ? ` at ${user.market_name}`
              : ""}
            .
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <Calendar size={15} className="text-slate-400" aria-hidden="true" />
          <select
            value={days}
            onChange={(event) => {
              setDays(Number(event.target.value) as Period);
              setOrdersPage(1);
            }}
            aria-label="Overview period"
            className="bg-transparent pr-1 font-medium focus:outline-none"
          >
            {PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isError && !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isFetching && data ? "opacity-70" : ""}`}
          >
            {isLoading || !overview ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[132px] animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))
            ) : (
              <>
                <StatCard
                  label="Total revenue"
                  value={peso(overview.revenue.value)}
                  versus={period.versus}
                  metric={overview.revenue}
                  icon={<Banknote size={16} />}
                  tone="bg-primary-50 text-primary-700"
                  to="/admin/reports"
                />
                <StatCard
                  label="Orders"
                  value={overview.orders.value.toLocaleString("en-PH")}
                  versus={period.versus}
                  metric={overview.orders}
                  icon={<ShoppingBag size={16} />}
                  tone="bg-orange-50 text-orange-600"
                  to="/admin/orders?status=all"
                />
                <StatCard
                  label={overview.customers_label}
                  value={overview.customers.value.toLocaleString("en-PH")}
                  versus={period.versus}
                  metric={overview.customers}
                  icon={<Users size={16} />}
                  tone="bg-violet-50 text-violet-600"
                />
                <StatCard
                  label="Average order"
                  value={peso(overview.average_order.value)}
                  versus={period.versus}
                  metric={overview.average_order}
                  icon={<Package size={16} />}
                  tone="bg-emerald-50 text-emerald-600"
                />
              </>
            )}
          </div>

          {data && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.scope === "market" ? (
                <>
                  <QueueChip
                    label="New orders"
                    count={data.status_breakdown.order_received}
                    to="/admin/orders?status=order_received"
                  />
                  <QueueChip
                    label="Confirmed"
                    count={data.status_breakdown.order_confirmed}
                    to="/admin/orders?status=order_confirmed"
                  />
                  <QueueChip
                    label="Preparing"
                    count={data.status_breakdown.preparing_items}
                    to="/admin/orders?status=preparing_items"
                  />
                  <QueueChip
                    label="Out for delivery"
                    count={data.status_breakdown.out_for_delivery}
                    to="/admin/orders?status=out_for_delivery"
                  />
                </>
              ) : (
                <>
                  <QueueChip label="Customers" count={data.total_customers} />
                  <QueueChip
                    label="All-time orders"
                    count={data.total_orders}
                    to="/admin/orders?status=all"
                  />
                  <QueueChip
                    label="Riders"
                    count={data.total_riders}
                    to="/admin/riders"
                  />
                  <QueueChip
                    label="Markets"
                    count={data.total_markets}
                    to="/admin/markets"
                  />
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent orders
                  </h3>
                  <p className="text-xs text-slate-500">
                    {orders
                      ? `${orders.total.toLocaleString("en-PH")} order${orders.total === 1 ? "" : "s"} ${period.summary} · newest first`
                      : "Loading…"}
                  </p>
                </div>
                <Link
                  to="/admin/orders?status=all"
                  className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
                >
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              {ordersLoading || !orders || !data ? (
                <SkeletonRows rows={5} />
              ) : orders.data.length === 0 ? (
                <EmptyPanel
                  title={days === 0 ? "No orders yet today" : "No orders in this period"}
                  description="Orders will appear here as soon as customers complete a checkout."
                  action={
                    <Link
                      to="/admin/items/new"
                      className="inline-flex rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Add your first item
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Order</th>
                        <th className="px-5 py-3 font-semibold">Customer</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.data.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:text-primary-700"
                            >
                              #{order.order_number}
                            </Link>
                            {data.scope === "platform" && order.market_name && (
                              <span className="block text-xs font-normal text-slate-400">
                                {order.market_name}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-3">
                              <InitialsAvatar name={order.customer_name} />
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-slate-800">
                                  {order.customer_name ?? "Guest"}
                                </span>
                                {order.customer_email && (
                                  <span className="block truncate text-xs text-slate-400">
                                    {order.customer_email}
                                  </span>
                                )}
                              </span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900">
                            {peso(order.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm">
                    <span className="text-slate-500">
                      Showing {orders.from ?? 0}–{orders.to ?? 0} of{" "}
                      {orders.total.toLocaleString("en-PH")} orders
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={orders.current_page <= 1}
                        onClick={() =>
                          setOrdersPage((current) => Math.max(1, current - 1))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      {pageNumbers(orders.current_page, orders.last_page).map(
                        (number, index) =>
                          number === null ? (
                            <span key={`gap-${index}`} className="px-1 text-slate-400">
                              …
                            </span>
                          ) : (
                            <button
                              type="button"
                              key={number}
                              onClick={() => setOrdersPage(number)}
                              aria-current={
                                number === orders.current_page ? "page" : undefined
                              }
                              className={`min-w-8 rounded-lg px-2.5 py-1.5 font-medium ${
                                number === orders.current_page
                                  ? "bg-primary text-white"
                                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {number}
                            </button>
                          ),
                      )}
                      <button
                        type="button"
                        disabled={orders.current_page >= orders.last_page}
                        onClick={() => setOrdersPage((current) => current + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {data?.scope === "platform" && (
              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h3 className="text-base font-semibold text-slate-900">Top markets</h3>
                  <Store size={16} className="text-slate-400" aria-hidden="true" />
                </div>
                {data.sales_per_market.length === 0 ? (
                  <EmptyPanel
                    title="No active markets"
                    description="Active markets with sales show up here."
                  />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.sales_per_market.map((market, index) => {
                      const top = Number(data.sales_per_market[0]?.total_sales ?? 0) || 1;
                      const share = (Number(market.total_sales ?? 0) / top) * 100;
                      return (
                        <li key={market.id} className="px-5 py-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 font-medium text-slate-800">
                              <span className="w-4 text-xs text-slate-400">
                                {index + 1}
                              </span>
                              {market.name}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {peso(market.total_sales, 0)}
                            </span>
                          </div>
                          <div
                            className="ml-6 mt-2 h-1.5 rounded-full bg-slate-100"
                            aria-hidden="true"
                          >
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
