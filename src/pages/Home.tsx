import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import PkProductCard from "@/components/pk/PkProductCard";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import PkProductModal from "@/features/home/PkProductModal";
import { listMarkets } from "@/services/api/markets";
import { listCategories } from "@/services/api/categories";
import { listProductTypes } from "@/services/api/productTypes";
import { listItems } from "@/services/api/items";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { useMarketStore } from "@/stores/marketStore";
import MarketPill from "@/features/home/MarketPill";

const SORT_OPTIONS = [
  { value: "recommended", label: "Featured" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "az", label: "Name: A–Z" },
];

/** The design's Shop page (.shop-page) — real catalog, categories, types, sort and search. */
export default function Home() {
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const setMarket = useMarketStore((state) => state.setMarket);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [search, setSearch] = useState(
    () =>
      params.get("search") ??
      (location.state as { search?: string } | null)?.search ??
      "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(() => {
    const fromUrl = Number(params.get("category"));
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : null;
  });
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

  const marketId = selectedMarket?.id;

  // Counts are per market so the sidebar matches what this shop actually lists.
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", marketId ?? null],
    queryFn: () => listCategories(marketId),
  });
  const { data: types = [] } = useQuery({
    queryKey: ["types"],
    queryFn: listProductTypes,
  });

  const {
    data: itemPages,
    isLoading,
    isError,
    refetch,
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

  // Load the next page automatically when the end of the grid scrolls into view.
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);
  const totalCount = itemPages?.pages[0]?.total ?? items.length;
  const allCount = categories.reduce(
    (sum, category) => sum + (category.items_count ?? 0),
    0,
  );

  function clearFilters() {
    setSearch("");
    setActiveCategoryId(null);
    setActiveTypeId(null);
  }

  return (
    <main className="inner-page shop-page">
      <section className="shop-top">
        <div className="shell shop-breadcrumb">
          <Link to="/">Home</Link>
          <Icon name="chevron" size={14} />
          <span>Shop</span>
        </div>
        <div className="shell shop-tools">
          <div>
            <MarketPill />
            <h1>Fresh market goods</h1>
          </div>
          <label className="catalog-search">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the market..."
              aria-label="Search the market"
            />
          </label>
          <label className="sort-select">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="shell mobile-category-row">
        <button
          type="button"
          className={activeCategoryId === null ? "active" : ""}
          onClick={() => setActiveCategoryId(null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={activeCategoryId === category.id ? "active" : ""}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="shell catalog-layout">
        <aside className="catalog-sidebar">
          <div>
            <h3>Categories</h3>
            <button
              type="button"
              className={activeCategoryId === null ? "active" : ""}
              onClick={() => setActiveCategoryId(null)}
            >
              <span>All</span>
              <small>{allCount || ""}</small>
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={activeCategoryId === category.id ? "active" : ""}
                onClick={() => setActiveCategoryId(category.id)}
              >
                <span>{category.name}</span>
                <small>{category.items_count ?? ""}</small>
              </button>
            ))}
          </div>
          {types.length > 0 && (
            <div>
              <h3>Product type</h3>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={activeTypeId === null}
                  onChange={() => setActiveTypeId(null)}
                />
                <span>All types</span>
              </label>
              {types.map((type) => (
                <label key={type.id}>
                  <input
                    type="radio"
                    name="type"
                    checked={activeTypeId === type.id}
                    onChange={() => setActiveTypeId(type.id)}
                  />
                  <span>{type.name}</span>
                </label>
              ))}
            </div>
          )}
          <button type="button" className="clear-filters" onClick={clearFilters}>
            Clear all filters
          </button>
        </aside>

        <section className="catalog-content">
          <article className="paluto-inline">
            <div>
              <span>
                <Icon name="sparkle" />
              </span>
              <div>
                <p className="kicker">
                  Available from {selectedMarket?.name ?? "your market"}
                </p>
                <h2>Try Paluto</h2>
                <p>
                  Choose a stall and we’ll buy the ingredients and have your meal cooked
                  fresh.
                </p>
              </div>
            </div>
            <button type="button" className="btn" onClick={() => navigate("/paluto")}>
              Explore Paluto <Icon name="arrow" size={17} />
            </button>
          </article>

          <div className="catalog-meta">
            <p>
              <strong>{totalCount}</strong> items found
            </p>
            {types.length > 0 && (
              <div className="mobile-type-filter">
                <select
                  value={activeTypeId ?? ""}
                  onChange={(event) =>
                    setActiveTypeId(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  aria-label="Product type"
                >
                  <option value="">All types</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!selectedMarket ? (
            <div className="empty">
              <Icon name="bag" size={34} />
              <h3>Choose a market to start shopping</h3>
              <p>We’ll show you what’s fresh and available today.</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => setPickerOpen(true)}
              >
                Choose market
              </button>
            </div>
          ) : isLoading ? (
            <div className="empty">
              <Icon name="leaf" size={34} />
              <h3>Loading the market…</h3>
            </div>
          ) : isError ? (
            <div className="empty">
              <Icon name="x" size={34} />
              <h3>Something went wrong</h3>
              <p>Please try again.</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => void refetch()}
              >
                Try again
              </button>
            </div>
          ) : items.length ? (
            <>
              <div className="catalog-grid">
                {items.map((item) => (
                  <PkProductCard
                    key={item.id}
                    item={item}
                    onView={() => setSelectedItemId(item.id)}
                  />
                ))}
              </div>
              {hasNextPage && (
                <div
                  ref={loadMoreRef}
                  style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
                >
                  <button
                    type="button"
                    className="btn outline"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <Icon name="bag" size={34} />
              <h3>No market items found</h3>
              <p>Try another category, type, or search term.</p>
              <button type="button" className="btn primary" onClick={clearFilters}>
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>

      {selectedItemId !== null && marketId !== undefined && (
        <PkProductModal
          itemId={selectedItemId}
          marketId={marketId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </main>
  );
}
