import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { getAdminDashboard } from "@/services/api/adminDashboard";

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-gradient-brand p-4 text-white shadow-soft">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

function peso(amount: number | string | null): string {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {data.scope === "market" ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Active orders" value={data.active_orders_count} />
            <Tile label="Today's sales" value={peso(data.today_sales)} />
            <Tile label="Received" value={data.status_breakdown.order_received} />
            <Tile label="Confirmed" value={data.status_breakdown.order_confirmed} />
            <Tile label="Preparing" value={data.status_breakdown.preparing_items} />
            <Tile
              label="Out for delivery"
              value={data.status_breakdown.out_for_delivery}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Recent orders
            </h2>
            <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
              {data.recent_orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-text">
                    #{order.order_number} · {order.customer?.fname}{" "}
                    {order.customer?.lname}
                  </span>
                  <span className="text-text-muted">{peso(order.total_amount)}</span>
                </li>
              ))}
              {data.recent_orders.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-text-muted">
                  No orders yet.
                </li>
              )}
            </ul>
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <Tile label="Markets" value={data.total_markets} />
            <Tile label="Admins" value={data.total_admins} />
            <Tile label="Riders" value={data.total_riders} />
            <Tile label="Total orders" value={data.total_orders} />
            <Tile label="Today's sales" value={peso(data.today_sales)} />
            <Tile label="Total sales" value={peso(data.total_sales)} />
            <Tile label="Items sold" value={data.total_items_sold} />
            <Tile label="Customers" value={data.total_customers} />
            <Tile label="Verified customers" value={data.verified_customers} />
            <Tile label="Pending verifications" value={data.pending_verifications} />
            <Tile label="Pending ID submissions" value={data.pending_id_submissions} />
            <Tile label="Rejected verifications" value={data.rejected_verifications} />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Top markets by sales
            </h2>
            <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
              {data.sales_per_market.map((market) => (
                <li
                  key={market.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-text">{market.name}</span>
                  <span className="text-text-muted">{peso(market.total_sales)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Recent orders
            </h2>
            <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
              {data.recent_orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-text">
                    #{order.order_number} · {order.market?.name}
                  </span>
                  <span className="text-text-muted">{peso(order.total_amount)}</span>
                </li>
              ))}
              {data.recent_orders.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-text-muted">
                  No orders yet.
                </li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
