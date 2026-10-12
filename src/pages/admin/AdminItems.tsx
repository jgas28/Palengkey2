import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import AdminTable, {
  AdminStatusPill,
  AdminThumb,
  adminTd,
  adminTdStrong,
} from "@/components/admin/AdminTable";
import ItemCsvImport from "@/features/admin/ItemCsvImport";
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
    // No market = the whole catalog (super admin); with a market, its prices too.
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Items</h1>
        <div className="flex gap-2">
          <ItemCsvImport />
          <Link to="/admin/items/new">
            <Button size="sm">Add item</Button>
          </Link>
        </div>
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
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
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
          <AdminTable
            head={["Item", "Category", "Unit", marketId ? "Price" : "Type", "Status", ""]}
          >
            {itemsPage.data.map((item) => {
              const editUrl = `/admin/items/${item.id}/edit${marketId ? `?market_id=${marketId}` : ""}`;
              return (
                <tr key={item.id} className="hover:bg-background/60">
                  <td className={adminTdStrong}>
                    <Link
                      to={editUrl}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <AdminThumb src={item.image_url} />
                      <span className="line-clamp-2">{item.name}</span>
                    </Link>
                  </td>
                  <td className={adminTd}>{item.category ?? "—"}</td>
                  <td className={adminTd}>{item.unit ?? "—"}</td>
                  <td className={adminTd}>
                    {marketId ? (
                      item.market?.price != null ? (
                        <span className="font-semibold text-text">
                          {formatPeso(Number(item.market.price))}
                        </span>
                      ) : (
                        "Not listed"
                      )
                    ) : (
                      (item.type ?? "—")
                    )}
                  </td>
                  <td className={adminTd}>
                    <div className="flex flex-wrap gap-1">
                      <AdminStatusPill active={item.status} />
                      {marketId && item.market && !item.market.is_available && (
                        <span className="rounded-pill bg-background px-2 py-0.5 text-xs font-medium text-text-muted">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={editUrl}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </AdminTable>

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
