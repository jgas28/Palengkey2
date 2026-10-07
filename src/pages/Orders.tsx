import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import {
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
  statusClass,
  statusStyle,
} from "@/features/orders/orderStatus";
import { listOrders } from "@/services/api/orders";
import { formatPeso } from "@/utils/currency";

/** The design's order history list. */
export default function Orders() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["orders"],
      queryFn: ({ pageParam }) => listOrders(pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    });

  const orders = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title">
        <p className="kicker">My purchases</p>
        <h1>Order history</h1>
        <p>Track active deliveries and look back at previous market runs.</p>
      </div>

      <section className="shell orders-list">
        {isLoading ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="bag" size={34} />
            <h3>Loading your orders…</h3>
          </div>
        ) : isError ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty" style={{ margin: 18 }}>
            <Icon name="bag" size={34} />
            <h3>No orders yet</h3>
            <p>Your orders will appear here once you place one.</p>
            <button type="button" className="btn primary" onClick={() => navigate("/shop")}>
              Start shopping
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const itemCount = order.items.length;
            return (
              <article key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="order-icon">
                  <Icon name="bag" />
                </div>
                <div>
                  <small>{order.order_number}</small>
                  <h3>
                    {itemCount} market item{itemCount === 1 ? "" : "s"}
                  </h3>
                  <p>
                    {new Date(order.received_at ?? order.created_at).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`status ${statusClass(order.status)}`} style={statusStyle(order.status)}>
                  {ORDER_STATUS_LABELS[normalizeOrderStatus(order.status)]}
                </span>
                <strong>{formatPeso(Number(order.total_amount))}</strong>
                <button type="button" aria-label={`View order ${order.order_number}`}>
                  <Icon name="chevron" />
                </button>
              </article>
            );
          })
        )}
      </section>

      {hasNextPage && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: -60, paddingBottom: 90 }}>
          <button type="button" className="btn outline" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
