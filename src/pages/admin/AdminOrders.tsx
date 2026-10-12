import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import OrderStatusBadge from "@/features/orders/OrderStatusBadge";
import { listAdminOrders } from "@/services/api/adminOrders";
import type { AdminOrderStatus } from "@/types/adminOrder";
import { paymentMethodLabel } from "@/features/orders/paymentMethods";

const FILTERS: { value: AdminOrderStatus | "all"; label: string }[] = [
  { value: "order_received", label: "New" },
  { value: "order_confirmed", label: "Confirmed" },
  { value: "preparing_items", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "all", label: "All" },
];

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<AdminOrderStatus | "all">(
    (searchParams.get("status") as AdminOrderStatus | "all" | null) ?? "order_received",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reservationsOnly, setReservationsOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Any filter change invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, reservationsOnly]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminOrders", filter, debouncedSearch, reservationsOnly, page],
    queryFn: () =>
      listAdminOrders({
        status: filter === "all" ? undefined : filter,
        search: debouncedSearch || undefined,
        reservationsOnly: reservationsOnly || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Orders</h1>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              filter === item.value
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {item.label}
            {data && item.value !== "all" && ` (${data.counts[item.value] ?? 0})`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order number, contact name, phone, email..."
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={reservationsOnly}
            onChange={(e) => setReservationsOnly(e.target.checked)}
          />
          Order later only
        </label>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.orders.data.length === 0 && (
        <EmptyState title="Nothing here." description="No orders match this filter." />
      )}

      {data && data.orders.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {data.orders.data.map((order) => (
            <li key={order.id}>
              <Link
                to={`/admin/orders/${order.id}`}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-text">#{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-xs text-text-muted">
                  {order.contact_name} · {order.contact_phone}
                  {order.customer && ` · ${order.customer.email}`}
                </span>
                <div className="flex w-full items-center justify-between text-xs text-text-muted">
                  <span>
                    {paymentMethodLabel(order.payment_method)} · {order.payment_status}
                    {order.is_reservation && " · Order later"}
                    {order.rider && ` · Rider: ${order.rider.name}`}
                  </span>
                  <span className="font-semibold text-text">₱{order.total_amount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.orders.last_page > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={data.orders.current_page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-text-muted">
            Page {data.orders.current_page} of {data.orders.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={data.orders.current_page >= data.orders.last_page}
            onClick={() => setPage((p) => Math.min(data.orders.last_page, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
