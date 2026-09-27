import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ChefHat,
  ImageOff,
  Leaf,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import AppleIcon from "@/components/icons/AppleIcon";
import GooglePlayIcon from "@/components/icons/GooglePlayIcon";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/common/LoadingState";
import { listCategories } from "@/services/api/categories";
import { getFeaturedReviews, getHeroStats } from "@/services/api/content";
import { listMarkets } from "@/services/api/markets";
import { listItems, listCuratedProducts } from "@/services/api/items";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { formatPeso } from "@/utils/currency";
import { FALLBACK_HERO_STATS } from "@/utils/heroStats";
import { useMarketStore } from "@/stores/marketStore";
import type { ItemSummary } from "@/types/item";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: ShoppingCart,
    title: "Browse & Order",
    desc: "Shop fresh produce and groceries from your local market — online, anytime.",
  },
  {
    step: "02",
    icon: Leaf,
    title: "We Shop For You",
    desc: "Our team visits the palengke and personally selects the freshest items for your order.",
  },
  {
    step: "03",
    icon: Truck,
    title: "Fast Delivery",
    desc: "Your order arrives fresh at your doorstep, same day. No hassle, no traffic.",
  },
];

export default function Global() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [failedHeroImages, setFailedHeroImages] = useState<Set<number>>(new Set());

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data: featuredReviews = [] } = useQuery({
    queryKey: ["featuredReviews"],
    queryFn: getFeaturedReviews,
  });

  const { data: heroStats } = useQuery({
    queryKey: ["heroStats"],
    queryFn: getHeroStats,
  });
  const displayedHeroStats = heroStats && heroStats.length > 0 ? heroStats : FALLBACK_HERO_STATS;

  // Never calls setMarket: browsing the landing page shouldn't silently commit
  // a market choice before the customer has expressed shopping intent.
  const selectedMarket = useMarketStore((state) => state.selectedMarket);

  const { data: autoMarkets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const coords = await getCurrentCoordinates();
      return listMarkets(coords ?? undefined);
    },
    enabled: !selectedMarket,
  });

  const marketId =
    selectedMarket?.id ??
    autoMarkets?.find((market) => market.has_items)?.id ??
    autoMarkets?.[0]?.id;

  const { data: itemPage, isLoading: itemsLoading } = useQuery({
    queryKey: ["landingItems", marketId],
    queryFn: () => listItems({ marketId: marketId!, page: 1 }),
    enabled: marketId !== undefined,
  });

  const availableItems = useMemo(
    () =>
      (itemPage?.data ?? []).filter(
        (item): item is ItemSummary & { price: number } => item.price !== null,
      ),
    [itemPage],
  );
  const fallbackFeatured = useMemo(() => availableItems.slice(0, 6), [availableItems]);
  const fallbackTopDeals = useMemo(
    () => availableItems.slice().sort((a, b) => a.price - b.price).slice(0, 4),
    [availableItems],
  );

  const { data: curatedHighlights, isLoading: curatedHighlightsLoading } = useQuery({
    queryKey: ["curatedProducts", "highlighted_products", marketId],
    queryFn: () => listCuratedProducts({ marketId: marketId!, section: "highlighted_products" }),
    enabled: marketId !== undefined,
  });
  const { data: curatedDeals, isLoading: curatedDealsLoading } = useQuery({
    queryKey: ["curatedProducts", "best_deals", marketId],
    queryFn: () => listCuratedProducts({ marketId: marketId!, section: "best_deals" }),
    enabled: marketId !== undefined,
  });

  const priceIsSet = (item: ItemSummary): item is ItemSummary & { price: number } =>
    item.price !== null;
  const curatedHighlightsAvailable = useMemo(
    () => (curatedHighlights ?? []).filter(priceIsSet),
    [curatedHighlights],
  );
  const curatedDealsAvailable = useMemo(
    () => (curatedDeals ?? []).filter(priceIsSet),
    [curatedDeals],
  );

  const featuredLoading = itemsLoading || curatedHighlightsLoading;
  const dealsLoading = itemsLoading || curatedDealsLoading;
  const featured =
    curatedHighlightsAvailable.length > 0 ? curatedHighlightsAvailable : fallbackFeatured;
  const topDeals = curatedDealsAvailable.length > 0 ? curatedDealsAvailable : fallbackTopDeals;

  // One real item per staple category (meat, fish, vegetable, chicken) so the
  // hero mosaic always reads as a balanced palengke spread instead of
  // whatever happened to be curated first. Falls back to the general
  // featured list to fill any slot with no real match — never fabricated.
  const heroMosaic = useMemo(() => {
    const pool = availableItems.length > 0 ? availableItems : featured;
    const used = new Set<number>();
    const pick = (keywords: string[]) => {
      const match = pool.find(
        (item) =>
          !used.has(item.id) &&
          item.image &&
          keywords.some(
            (kw) =>
              item.name.toLowerCase().includes(kw) ||
              (item.category?.toLowerCase().includes(kw) ?? false) ||
              (item.type?.toLowerCase().includes(kw) ?? false),
          ),
      );
      if (match) used.add(match.id);
      return match;
    };

    const meat = pick(["meat", "beef", "pork", "baboy", "karne"]);
    const fish = pick(["fish", "seafood", "bangus", "tilapia", "isda", "shrimp", "squid"]);
    const vegetable = pick(["vegetable", "gulay"]);
    const chicken = pick(["chicken", "manok", "poultry"]);

    const picks = [meat, fish, vegetable, chicken].filter(
      (item): item is (typeof pool)[number] => item !== undefined,
    );

    for (const item of pool) {
      if (picks.length >= 4) break;
      if (!used.has(item.id) && item.image) {
        picks.push(item);
        used.add(item.id);
      }
    }

    return picks.slice(0, 4);
  }, [availableItems, featured]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    navigate("/shop", { state: { search: searchQuery } });
  }

  return (
    <div className="-mx-4 -mt-4 bg-white md:-mx-6">
      {/* Hero */}
      <section className="border-b border-[#DDE9EA] bg-[#F7FAFA]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E8F7F7] px-3 py-1.5 text-xs font-semibold text-[#0097A7]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0097A7]" />
              Now delivering in Cubao&apos;s Farmers Market
            </span>

            <h1 className="mb-5 font-display text-4xl font-bold leading-[1.1] text-[#203238] md:text-5xl lg:text-[56px]">
              Your palengke,{" "}
              <span className="text-[#0097A7]">delivered fresh.</span>
            </h1>

            <p className="mb-8 max-w-md text-base leading-relaxed text-[#66777C] md:text-lg">
              Shop fresh vegetables, meat, seafood, and more — sourced directly from your
              local market every morning.
            </p>

            <form onSubmit={handleSearch} className="mb-6 flex max-w-md gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#DDE9EA] bg-white px-4 py-3 shadow-sm transition-all focus-within:border-[#0097A7]">
                <Search size={16} className="shrink-0 text-[#66777C]" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tomatoes, chicken, rice…"
                  className="flex-1 bg-transparent text-sm text-[#203238] outline-none placeholder:text-[#66777C]"
                />
              </div>
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl bg-[#0097A7] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#006D77]"
              >
                Search
              </button>
            </form>

            <div className="mb-8 flex flex-wrap gap-2">
              <Link
                to="/shop"
                className="rounded-full border border-[#DDE9EA] bg-white px-3 py-1.5 text-xs font-medium text-[#66777C] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
              >
                Browse groceries →
              </Link>
              <Link
                to="/paluto"
                className="rounded-full border border-[#DDE9EA] bg-white px-3 py-1.5 text-xs font-medium text-[#66777C] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
              >
                Paluto →
              </Link>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-medium text-[#66777C]">
                Mobile app — coming soon
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-[#203238] px-4 py-2.5 opacity-70">
                  <AppleIcon className="h-5 w-5 shrink-0 text-white" />
                  <span>
                    <span className="block text-[9px] leading-none text-white/60">Coming to</span>
                    <span className="block text-sm font-bold leading-tight text-white">
                      App Store
                    </span>
                  </span>
                </span>
                <span className="flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-[#203238] px-4 py-2.5 opacity-70">
                  <GooglePlayIcon className="h-5 w-5 shrink-0 text-white" />
                  <span>
                    <span className="block text-[9px] leading-none text-white/60">Coming to</span>
                    <span className="block text-sm font-bold leading-tight text-white">
                      Google Play
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right — product mosaic (real featured items). Layout adapts to
              however many real images are actually available, rather than
              leaving empty grid slots when there are fewer than 4. */}
          {heroMosaic.length > 0 && (
            <div className="hidden grid-cols-2 gap-3 md:grid">
              {heroMosaic.map((item, i) => (
                <Link
                  key={item.id}
                  to="/shop"
                  className={`group relative overflow-hidden rounded-2xl ${
                    heroMosaic.length === 1 || (heroMosaic.length === 3 && i === 0)
                      ? "col-span-2"
                      : ""
                  }`}
                  style={{
                    height:
                      heroMosaic.length === 1
                        ? "400px"
                        : heroMosaic.length === 2
                          ? "260px"
                          : heroMosaic.length === 3
                            ? i === 0
                              ? "220px"
                              : "180px"
                            : i % 2 === 0
                              ? "220px"
                              : "180px",
                  }}
                >
                  {item.image && !failedHeroImages.has(item.id) ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={() =>
                        setFailedHeroImages((prev) => new Set(prev).add(item.id))
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#E8F7F7] text-[#0097A7]">
                      <ImageOff size={32} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="text-sm font-semibold leading-tight text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-white/80">
                      {formatPeso(item.price)}
                      {item.unit ? `/${item.unit}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="border-t border-[#DDE9EA] bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex shrink-0 items-center gap-2 text-sm text-[#66777C]">
              <ShieldCheck size={16} className="text-[#0097A7]" aria-hidden="true" />
              <span>Quality guaranteed</span>
            </div>
            <span className="text-[#DDE9EA]">·</span>
            <div className="flex shrink-0 items-center gap-2 text-sm text-[#66777C]">
              <Zap size={16} className="text-[#0097A7]" aria-hidden="true" />
              <span>Same-day delivery</span>
            </div>
            <span className="text-[#DDE9EA]">·</span>
            {displayedHeroStats.map(({ value, label }, i) => (
              <span key={label} className="flex shrink-0 items-center gap-2 text-sm">
                <span className="font-bold text-[#0097A7]">{value}</span>
                <span className="text-[#66777C]">{label}</span>
                {i < displayedHeroStats.length - 1 && <span className="text-[#DDE9EA]">·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#0097A7]">
              Browse
            </p>
            <h2 className="font-display text-2xl font-bold text-[#203238]">Shop by Category</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-[#0097A7] hover:underline">
            See all →
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8 md:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/shop"
                className="group flex flex-col items-center gap-2"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F7FAFA] shadow-sm ring-1 ring-[#DDE9EA] transition-all group-hover:shadow-md group-hover:ring-[#0097A7]">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#0097A7]">
                      <ShoppingCart size={24} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <span className="text-center text-[11px] font-semibold leading-tight text-[#203238] transition-colors group-hover:text-[#0097A7]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promo banner */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#203238]">
          <div className="relative flex flex-col items-start justify-between gap-6 px-8 py-10 md:flex-row md:items-center md:px-12 md:py-12">
            <div>
              <span className="mb-3 inline-block rounded-full bg-[#0097A7] px-3 py-1 text-xs font-bold text-white">
                Fresh Every Day
              </span>
              <h3 className="mb-2 font-display text-2xl font-bold text-white md:text-3xl">
                Your market run, made easy.
              </h3>
              <p className="max-w-sm text-sm text-white/60">
                Skip the trip — we shop the palengke for you and deliver it fresh.
              </p>
            </div>
            <Link
              to="/shop"
              className="shrink-0 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#203238] shadow-md transition-colors hover:bg-[#E8F7F7]"
            >
              Start Shopping →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#0097A7]">
              Today&apos;s picks
            </p>
            <h2 className="font-display text-2xl font-bold text-[#203238]">
              Featured Products
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-[#0097A7] hover:underline">
            View all →
          </Link>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          featured.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  to="/shop"
                  className="group overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#F7FAFA]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#0097A7]">
                        <ImageOff size={32} strokeWidth={1.5} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-[#203238]">
                      {item.name}
                    </h3>
                    <p className="font-bold text-[#0097A7]">
                      {formatPeso(item.price)}
                      {item.unit ? <span className="text-xs font-normal text-[#66777C]">/{item.unit}</span> : null}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </section>

      {/* Today's best deals — kept directly under Featured Products so the two
          curated-picks sections read as one group, per the client's request. */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#F0A500]">
              Best Value
            </p>
            <h2 className="font-display text-2xl font-bold text-[#203238]">
              Today&apos;s Best Deals
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-[#0097A7] hover:underline">
            See all deals →
          </Link>
        </div>
        {dealsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          topDeals.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topDeals.map((item) => (
                <Link
                  key={item.id}
                  to="/shop"
                  className="group overflow-hidden rounded-2xl border border-[#DDE9EA] bg-[#F7FAFA] transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-white">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#0097A7]">
                        <ImageOff size={24} strokeWidth={1.5} aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-[#F0A500] px-2 py-0.5 text-[10px] font-bold text-white">
                      Best Deal
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-[#203238]">
                      {item.name}
                    </h3>
                    <p className="font-bold text-[#0097A7]">{formatPeso(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </section>

      {/* Paluto CTA */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/paluto"
            className="group relative overflow-hidden rounded-3xl border border-[#DDE9EA] bg-[#FFF9F0] p-8 transition-colors hover:border-[#0097A7]"
          >
            <div className="relative z-10">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0097A7]/10 text-[#0097A7]">
                <ChefHat size={24} aria-hidden="true" />
              </span>
              <h3 className="mb-2 font-display text-xl font-bold text-[#203238]">
                Paluto — Cook for Me
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[#66777C]">
                Pick a Filipino recipe. We source the ingredients from the market and cook it
                fresh for you.
              </p>
              <span className="text-sm font-semibold text-[#0097A7] group-hover:underline">
                Explore recipes →
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-7xl opacity-10 transition-opacity group-hover:opacity-20">
              🍲
            </div>
          </Link>

          <Link
            to="/paluto"
            className="group relative overflow-hidden rounded-3xl border border-[#DDE9EA] bg-[#E8F7F7] p-8 transition-colors hover:border-[#0097A7]"
          >
            <div className="relative z-10">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0097A7]/10 text-[#0097A7]">
                <ShoppingCart size={24} aria-hidden="true" />
              </span>
              <h3 className="mb-2 font-display text-xl font-bold text-[#203238]">
                Buy Recipe Ingredients
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[#66777C]">
                Choose a recipe and add all the raw ingredients to your cart in one tap. You
                cook, we deliver.
              </p>
              <span className="text-sm font-semibold text-[#0097A7] group-hover:underline">
                Browse recipes →
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-7xl opacity-10 transition-opacity group-hover:opacity-20">
              🥬
            </div>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#DDE9EA] bg-[#F7FAFA]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#0097A7]">
              Simple process
            </p>
            <h2 className="font-display text-2xl font-bold text-[#203238]">
              How Palengkey Works
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex gap-5">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDE9EA] bg-white shadow-sm">
                    <Icon size={22} className="text-[#0097A7]" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-[#0097A7]">{step}</p>
                  <h3 className="mb-1.5 font-semibold text-[#203238]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#66777C]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — no direct Figma equivalent page, so this follows the
          same white-bordered-card language Figma uses for Featured Products
          and About's value cards, on the light [#F7FAFA] band Figma uses for
          "How it works", instead of the teal/translucent treatment used before. */}
      <section className="border-t border-[#DDE9EA] bg-[#F7FAFA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#0097A7]">
              Suki Trust Level
            </p>
            <h2 className="font-display text-2xl font-bold text-[#203238]">
              Fresh orders, trusted suki experiences
            </h2>
          </div>

          {featuredReviews.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {featuredReviews.map((review, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-2xl border border-[#DDE9EA] bg-white p-6"
                >
                  <div aria-hidden="true" className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, starIndex) => (
                      <Star key={starIndex} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-[#66777C]">
                    &quot;{review.comment}&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F7F7] text-xs font-bold text-[#0097A7]">
                      {review.public_customer_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#203238]">
                        {review.public_customer_name}
                      </p>
                      {review.market_name && (
                        <p className="text-xs text-[#66777C]">{review.market_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: "4.9", label: "Average Rating" },
                { value: "500+", label: "Happy Sukis" },
                { value: "100%", label: "Fresh Daily" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-[#DDE9EA] bg-white px-8 py-6"
                >
                  <div>
                    <div className="font-display text-4xl font-black text-[#0097A7]">{value}</div>
                    <div className="mt-0.5 text-sm text-[#66777C]">{label}</div>
                  </div>
                  <Users size={28} className="text-[#0097A7]/40" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
