import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listAdminItems } from "@/services/api/adminItems";
import { listAdminMarkets } from "@/services/api/adminLookups";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { formatPeso } from "@/utils/currency";

export default function AdminItems() {
  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [marketId, setMarketId] = useState<number | undefined>(
    user?.market_id ?? undefined,
  );

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin,
  });

  const {
    data: itemsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminItems", marketId, search, page],
    queryFn: () => listAdminItems({ marketId, search, page }),
    enabled: !isSuperAdmin || marketId !== undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Items</h1>
        <Link to="/admin/items/new">
          <Button size="sm">Add item</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search items…"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        {isSuperAdmin && (
          <select
            value={marketId ?? ""}
            onChange={(event) => {
              setMarketId(event.target.value ? Number(event.target.value) : undefined);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All markets</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isSuperAdmin && marketId === undefined && (
        <p className="text-sm text-text-muted">
          Choose a market above to see and manage its listings, or leave it blank to
          browse the whole catalog.
        </p>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {itemsPage && itemsPage.data.length === 0 && (
        <EmptyState
          title="No items yet."
          description="Add your first item to start listing it for sale."
        />
      )}

      {itemsPage && itemsPage.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {itemsPage.data.map((item) => (
              <Link
                key={item.id}
                to={`/admin/items/${item.id}/edit${marketId ? `?market_id=${marketId}` : ""}`}
                className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative bg-background">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {!item.status && (
                    <span className="absolute left-2 top-2 rounded-pill bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-text">
                    {item.name}
                  </span>
                  {item.market ? (
                    item.market.is_available ? (
                      <span className="mt-auto text-sm font-bold text-primary-700">
                        {formatPeso(Number(item.market.price ?? 0))}
                      </span>
                    ) : (
                      <span className="mt-auto inline-flex w-fit items-center rounded-pill bg-background px-2 py-0.5 text-xs font-medium text-text-muted">
                        Unavailable
                      </span>
                    )
                  ) : (
                    <span className="mt-auto text-xs text-text-muted">{item.category}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              Page {itemsPage.current_page} of {itemsPage.last_page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={itemsPage.current_page >= itemsPage.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
