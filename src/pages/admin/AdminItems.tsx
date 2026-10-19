import { useEffect, useState, type ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Leaf,
  Plus,
  Search,
} from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import { AdminThumb } from "@/components/admin/AdminTable";
import ItemCsvImport from "@/features/admin/ItemCsvImport";
import { listAdminItems } from "@/services/api/adminItems";
import { listAdminCategories, listAdminMarkets } from "@/services/api/adminLookups";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { formatPeso } from "@/utils/currency";
import type { AdminItem } from "@/types/adminItem";

type StatusFilter = "" | "active" | "inactive" | "available" | "unavailable";

const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:text-slate-400";

/** "Today", "Yesterday", "3 days ago" in Manila time. */
function relativeDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const diff = Math.round(
    (new Date(day(new Date())).getTime() - new Date(day(new Date(iso))).getTime()) /
      86400000,
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}

/** "15:00" → "3:00 PM". */
function clock(time: string | null | undefined): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function SummaryCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block font-display text-2xl font-semibold text-slate-900">
          {value}
        </span>
        <span className="block truncate text-xs text-slate-400">{hint}</span>
      </span>
    </Card>
  );
}

function AvailabilityCell({ item, marketId }: { item: AdminItem; marketId?: number }) {
  if (!marketId || !item.market) {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          item.status ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {item.status ? "Active" : "Inactive"}
      </span>
    );
  }
  const state = !item.status
    ? "inactive"
    : (item.market.availability ??
      (item.market.is_available ? "available" : "unavailable"));
  const look = {
    available: ["bg-emerald-50 text-emerald-700", "Available", "Order today"],
    out_of_stock: ["bg-amber-50 text-amber-700", "Out of stock", "Back tomorrow"],
    unavailable: ["bg-rose-50 text-rose-600", "Unavailable", "Seasonal"],
    inactive: ["bg-slate-100 text-slate-500", "Inactive", "Hidden from customers"],
  }[state];
  return (
    <span>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${look[0]}`}>
        {look[1]}
      </span>
      <span className="mt-1.5 block text-[11px] text-slate-400">{look[2]}</span>
    </span>
  );
}

export default function AdminItems() {
  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [marketId, setMarketId] = useState<number | undefined>(
    user?.market_id ?? undefined,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: listAdminCategories,
  });

  const {
    data: itemsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminItems", marketId, debouncedSearch, categoryId, statusFilter, page],
    queryFn: () =>
      listAdminItems({
        marketId,
        search: debouncedSearch,
        categoryId,
        status:
          statusFilter === "active" ? "1" : statusFilter === "inactive" ? "0" : undefined,
        availability:
          statusFilter === "available" || statusFilter === "unavailable"
            ? statusFilter
            : undefined,
        page,
      }),
    // No market = the whole catalog (super admin); with a market, its prices too.
    placeholderData: keepPreviousData,
  });
  const summary = itemsPage?.summary;
  const filtered = Boolean(debouncedSearch || categoryId || statusFilter);

  const editUrl = (item: AdminItem) =>
    `/admin/items/${item.id}/edit${marketId ? `?market_id=${marketId}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
            Catalog
          </p>
          <h2 className="font-display text-3xl font-semibold text-slate-900">Items</h2>
          <p className="text-sm text-slate-500">
            Manage customer-facing listings, market pricing, and availability.
          </p>
        </div>
        <div className="flex gap-2">
          <ItemCsvImport
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="flex items-center gap-2 rounded-xl border border-primary-300 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-50"
              >
                <ArrowRight size={16} aria-hidden="true" /> Import CSV
              </button>
            )}
          />
          <Link
            to="/admin/items/new"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus size={16} aria-hidden="true" /> Add item
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Leaf size={20} />}
          tone="bg-primary-50 text-primary-700"
          label="Total items"
          value={String(summary?.total ?? "–")}
          hint={marketId ? "Listed in this market" : "Across all markets"}
        />
        <SummaryCard
          icon={<Check size={20} />}
          tone="bg-emerald-50 text-emerald-600"
          label="Active listings"
          value={String(summary?.active ?? "–")}
          hint="Visible to customers"
        />
        <SummaryCard
          icon={<Bell size={20} />}
          tone="bg-amber-50 text-amber-600"
          label="Needs attention"
          value={String(summary?.needs_attention ?? "–")}
          hint={marketId ? "Unavailable in this market" : "Not listed in any market"}
        />
        <SummaryCard
          icon={<Clock size={20} />}
          tone="bg-sky-50 text-sky-600"
          label="Updated today"
          value={String(summary?.updated_today ?? "–")}
          hint={marketId ? "Price or stock changes" : "Catalog edits"}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <label className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-600"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <select
            aria-label="Category"
            value={categoryId ?? ""}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {isSuperAdmin && (
            <select
              aria-label="Market"
              value={marketId ?? ""}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : undefined;
                setMarketId(next);
                if (
                  !next &&
                  (statusFilter === "available" || statusFilter === "unavailable")
                ) {
                  setStatusFilter("");
                }
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All markets</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="available" disabled={!marketId}>
              Available{!marketId ? " (pick a market)" : ""}
            </option>
            <option value="unavailable" disabled={!marketId}>
              Unavailable{!marketId ? " (pick a market)" : ""}
            </option>
          </select>
        </div>

        {isLoading && <SkeletonRows rows={8} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}

        {itemsPage && itemsPage.data.length === 0 && (
          <EmptyPanel
            title={filtered ? "No items match." : "No items yet."}
            description={
              filtered
                ? "Try another search or filter."
                : "Add your first item to start listing it for sale."
            }
          />
        )}

        {itemsPage && itemsPage.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Market</th>
                  <th className="px-5 py-3 font-semibold">Pricing</th>
                  <th className="px-5 py-3 font-semibold">Availability</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsPage.data.map((item) => {
                  const listing = marketId ? item.market : null;
                  const cutoff = clock(listing?.cutoff_time);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(editUrl(item))}
                      className="cursor-pointer hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <span className="[&>*]:h-12 [&>*]:w-12 [&>*]:rounded-xl">
                            <AdminThumb src={item.image_url} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-900">
                              {item.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {[item.sku, item.category, item.unit]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {listing ? (
                          <>
                            <span className="block font-medium text-slate-800">
                              {listing.market_name ?? "This market"}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {item.type ?? "—"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block font-medium text-slate-800">
                              {item.markets_count
                                ? `${item.markets_count} market${item.markets_count === 1 ? "" : "s"}`
                                : "Not listed"}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {item.type ?? "—"}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {listing?.price != null ? (
                          <>
                            <span className="block font-semibold text-slate-900">
                              {formatPeso(
                                Number(listing.customer_price ?? listing.price),
                              )}
                            </span>
                            <span className="block text-xs text-slate-500">
                              Vendor {formatPeso(Number(listing.price))}
                              {item.unit && ` · ${item.unit}`}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {marketId ? "No price yet" : "Pick a market"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <AvailabilityCell item={item} marketId={marketId} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="block font-medium text-slate-800">
                          {relativeDay(item.updated_at)}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {cutoff ? `Cutoff ${cutoff}` : marketId ? "No cutoff" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={editUrl(item)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-primary-700"
                        >
                          Edit <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {itemsPage && itemsPage.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {itemsPage.current_page} of {itemsPage.last_page}
              {itemsPage.total !== undefined && ` · ${itemsPage.total} items`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={itemsPage.current_page >= itemsPage.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
