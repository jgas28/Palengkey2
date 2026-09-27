import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChefHat, Search, Store, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ProductCard from "@/features/home/ProductCard";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { listMarkets } from "@/services/api/markets";
import { listCategories } from "@/services/api/categories";
import { listProductTypes } from "@/services/api/productTypes";
import { listItems } from "@/services/api/items";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { useMarketStore } from "@/stores/marketStore";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "az", label: "A–Z" },
];

export default function Home() {
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const setMarket = useMarketStore((state) => state.setMarket);
  const navigate = useNavigate();
  const location = useLocation();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState(
    () => (location.state as { search?: string } | null)?.search ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeTypeId, setActiveTypeId] = useState<number | null>(null);
  const [sort, setSort] = useState("recommended");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: autoMarkets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const coords = await getCurrentCoordinates();
      return listMarkets(coords ?? undefined);
    },
    enabled: !selectedMarket,
  });

  useEffect(() => {
    if (!selectedMarket && autoMarkets && autoMarkets.length > 0) {
      setMarket(autoMarkets.find((market) => market.has_items) ?? autoMarkets[0]);
    }
  }, [selectedMarket, autoMarkets, setMarket]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types"],
    queryFn: listProductTypes,
  });

  const marketId = selectedMarket?.id;

  const {
    data: itemPages,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["items", marketId, activeCategoryId, activeTypeId, debouncedSearch, sort],
    queryFn: ({ pageParam }) =>
      listItems({
        marketId: marketId!,
        categoryId: activeCategoryId ?? undefined,
        typeId: activeTypeId ?? undefined,
        search: debouncedSearch,
        sort,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    enabled: marketId !== undefined,
  });

  const items = useMemo(
    () => itemPages?.pages.flatMap((page) => page.data) ?? [],
    [itemPages],
  );
  const totalCount = itemPages?.pages[0]?.total ?? items.length;

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const categoryLabel = activeCategory?.name ?? "All Products";

  if (!selectedMarket) {
    return (
      <>
        <EmptyState
          icon={<span className="text-5xl">🧺</span>}
          title="Choose a market to start shopping"
          description="We'll show you what's fresh and available today."
          action={
            <Button variant="solid" onClick={() => setPickerOpen(true)}>
              Choose market
            </Button>
          }
        />
        <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-8 md:-mx-6 md:pb-0">
      {/* Sticky search bar */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-[#DDE9EA] bg-white lg:top-[calc(5rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          <nav className="hidden shrink-0 items-center gap-1 text-xs text-[#66777C] sm:flex">
            <Link to="/shop" className="transition-colors hover:text-[#0097A7]">
              Shop
            </Link>
            <span>/</span>
            <span className="font-medium text-[#203238]">{categoryLabel}</span>
          </nav>

          <div className="hidden h-4 w-px bg-[#DDE9EA] sm:block" />

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0097A7]"
          >
            <Store size={15} aria-hidden="true" />
            <span className="max-w-[8rem] truncate">{selectedMarket.name}</span>
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] px-3 py-2 transition-colors focus-within:border-[#0097A7]">
            <Search size={16} className="shrink-0 text-[#66777C]" aria-hidden="true" />
            <input
              type="text"
              placeholder="Ano ang hanap mo?"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent text-sm text-[#203238] outline-none placeholder:text-[#66777C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="shrink-0 text-[#66777C] transition-colors hover:text-[#203238]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="hidden cursor-pointer rounded-xl border border-[#DDE9EA] bg-white px-3 py-2 text-sm text-[#203238] outline-none md:block"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="rounded-2xl border border-[#DDE9EA] bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#203238]">
              Categories
            </h3>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  activeCategoryId === null
                    ? "bg-[#E8F7F7] font-semibold text-[#0097A7]"
                    : "text-[#66777C] hover:bg-[#F7FAFA] hover:text-[#203238]"
                }`}
              >
                <span>All Products</span>
                <span className={activeCategoryId === null ? "text-[#0097A7]" : "text-[#66777C]"}>
                  {totalCount}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setActiveCategoryId(activeCategoryId === category.id ? null : category.id)
                  }
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeCategoryId === category.id
                      ? "bg-[#E8F7F7] font-semibold text-[#0097A7]"
                      : "text-[#66777C] hover:bg-[#F7FAFA] hover:text-[#203238]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full bg-[#F7FAFA]" />
                    )}
                    <span className="truncate">{category.name}</span>
                  </span>
                  <span
                    className={`shrink-0 ${
                      activeCategoryId === category.id ? "text-[#0097A7]" : "text-[#66777C]"
                    }`}
                  >
                    {category.items_count ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {types.length > 0 && (
              <>
                <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-[#203238]">
                  Type
                </h3>
                <div className="space-y-0.5">
                  {types.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setActiveTypeId(activeTypeId === type.id ? null : type.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        activeTypeId === type.id
                          ? "bg-[#E8F7F7] font-semibold text-[#0097A7]"
                          : "text-[#66777C] hover:bg-[#F7FAFA] hover:text-[#203238]"
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <Link
            to="/paluto"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-[#DDE9EA] bg-white p-3.5 transition-all active:scale-[0.99] md:hover:border-[#0097A7]/40"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F7F7] text-[#0097A7]"
            >
              <ChefHat size={22} aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-bold text-[#203238]">Try Paluto</span>
              <span className="text-xs text-[#66777C]">
                Pick a recipe — get it cooked at a stall or delivered raw
              </span>
            </span>
          </Link>

          {/* Mobile category chips */}
          <div className="scrollbar-hide -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategoryId === null
                  ? "bg-[#0097A7] text-white"
                  : "border border-[#DDE9EA] bg-white text-[#66777C]"
              }`}
            >
              All ({totalCount})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setActiveCategoryId(activeCategoryId === category.id ? null : category.id)
                }
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategoryId === category.id
                    ? "bg-[#0097A7] text-white"
                    : "border border-[#DDE9EA] bg-white text-[#66777C]"
                }`}
              >
                {category.name} ({category.items_count ?? 0})
              </button>
            ))}
          </div>

          {/* Grid header */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#203238]">
              <span className="font-bold">{totalCount}</span> product
              {totalCount !== 1 ? "s" : ""} in{" "}
              <span className="text-[#0097A7]">{categoryLabel}</span>
            </p>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="cursor-pointer rounded-xl border border-[#DDE9EA] bg-white px-3 py-1.5 text-xs text-[#203238] outline-none md:hidden"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {itemsLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] w-full" />
              ))}
            </div>
          )}

          {itemsError && <ErrorState onRetry={() => void refetchItems()} />}

          {!itemsLoading && !itemsError && items.length === 0 && (
            <div className="rounded-2xl border border-[#DDE9EA] bg-white py-20 text-center">
              <p className="mb-4 text-5xl">🥬</p>
              <h3 className="mb-2 font-semibold text-[#203238]">Nothing here yet</h3>
              <p className="mb-5 text-sm text-[#66777C]">
                Try a different search or browse another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategoryId(null);
                  setActiveTypeId(null);
                }}
                className="text-sm font-medium text-[#0097A7] hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {!itemsLoading && !itemsError && items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onClick={() => navigate(`/product/${item.id}`)}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    loading={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
