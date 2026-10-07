import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Icon, { type IconName } from "@/components/pk/Icon";
import PkProductCard from "@/components/pk/PkProductCard";
import { photos } from "@/components/pk/photos";
import { listCategories } from "@/services/api/categories";
import { getFeaturedReviews, getHeroStats } from "@/services/api/content";
import { listMarkets } from "@/services/api/markets";
import { listItems, listCuratedProducts } from "@/services/api/items";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { FALLBACK_HERO_STATS } from "@/utils/heroStats";
import { useMarketStore } from "@/stores/marketStore";
import type { Category } from "@/types/category";
import type { ItemSummary } from "@/types/item";

/** Icon per category, matched on the category name (no icon field in the CMS). */
function categoryIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (/(fish|seafood|isda)/.test(n)) return "fish";
  if (/(poultry|chicken|manok|frozen)/.test(n)) return "sparkle";
  if (/(veg|gulay|fruit|prutas|herb)/.test(n)) return "leaf";
  if (/(pantry|essential|grocery)/.test(n)) return "cart";
  return "bag";
}

function categoryDetail(category: Category): string {
  return category.items_count !== undefined
    ? `${category.items_count} item${category.items_count === 1 ? "" : "s"}`
    : "Shop now";
}

/** The category's CMS image in the design's round tile; its icon when there's no image (or it fails to load). */
function CategoryThumb({ category }: { category: Category }) {
  const [failed, setFailed] = useState(false);

  if (!category.image_url || failed) {
    return (
      <span>
        <Icon name={categoryIcon(category.name)} />
      </span>
    );
  }

  return (
    <span style={{ overflow: "hidden", background: "white" }}>
      <img src={category.image_url} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

/** The Figma landing page — hero, trust strip, categories, featured products, deal, Paluto/Recipes, how it works, reviews. */
export default function Global() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const { data: featuredReviews = [] } = useQuery({
    queryKey: ["featuredReviews"],
    queryFn: getFeaturedReviews,
  });
  const { data: heroStats } = useQuery({ queryKey: ["heroStats"], queryFn: getHeroStats });
  const stats = heroStats && heroStats.length > 0 ? heroStats : FALLBACK_HERO_STATS;

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
  const market =
    selectedMarket ?? autoMarkets?.find((m) => m.has_items) ?? autoMarkets?.[0] ?? null;
  const marketId = market?.id;
  const marketName = market?.name ?? "your local palengke";

  const { data: itemPage } = useQuery({
    queryKey: ["landingItems", marketId],
    queryFn: () => listItems({ marketId: marketId!, page: 1 }),
    enabled: marketId !== undefined,
  });
  const { data: curatedHighlights } = useQuery({
    queryKey: ["curatedProducts", "highlighted_products", marketId],
    queryFn: () => listCuratedProducts({ marketId: marketId!, section: "highlighted_products" }),
    enabled: marketId !== undefined,
  });
  const { data: curatedDeals } = useQuery({
    queryKey: ["curatedProducts", "best_deals", marketId],
    queryFn: () => listCuratedProducts({ marketId: marketId!, section: "best_deals" }),
    enabled: marketId !== undefined,
  });

  const priced = (items: ItemSummary[] | undefined) =>
    (items ?? []).filter((item) => item.price !== null);
  const featured = useMemo(() => {
    const curated = priced(curatedHighlights);
    return (curated.length > 0 ? curated : priced(itemPage?.data)).slice(0, 8);
  }, [curatedHighlights, itemPage]);
  const bestDeal = useMemo(() => {
    const curated = priced(curatedDeals);
    if (curated.length > 0) return curated[0];
    return priced(itemPage?.data)
      .slice()
      .sort((a, b) => Number(a.price) - Number(b.price))[0];
  }, [curatedDeals, itemPage]);

  const featuredCategories = useMemo(
    () => [...new Set(featured.map((item) => item.category).filter(Boolean))].slice(0, 3),
    [featured],
  ) as string[];
  const shownProducts = featured.filter(
    (item) => activeCategory === "All" || item.category === activeCategory,
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    navigate(search.trim() ? `/shop?search=${encodeURIComponent(search.trim())}` : "/shop");
  }

  const ratingStat = stats[stats.length - 1];

  return (
    <div id="top">
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="location-pill">
                <span></span> Now delivering from {marketName}
              </div>
              <h1>
                Your palengke,
                <br />
                <em>delivered fresh.</em>
              </h1>
              <p className="hero-lead">
                Preskong gulay, isda, karne, at iba pa — handpicked by your trusted market
                shopper and delivered to your door.
              </p>
              <form className="search-box" onSubmit={handleSearch}>
                <Icon name="search" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ano ang hanap mo today?"
                  aria-label="Search groceries"
                />
                <button type="submit" className="btn primary">
                  Search
                </button>
              </form>
              {categories.length > 0 && (
                <div className="quick-links">
                  <span>Popular:</span>
                  {categories.slice(0, 3).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigate(`/shop?category=${category.id}`)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="hero-actions">
                <Link className="link-arrow" to="/shop">
                  Browse groceries <Icon name="arrow" size={18} />
                </Link>
                <Link className="paluto-link" to="/paluto">
                  <Icon name="sparkle" size={18} /> Try Paluto
                </Link>
              </div>
            </div>
            <div className="hero-visual" aria-label="Fresh produce from local market vendors">
              <div className="photo photo-main">
                <img src={photos.market} alt="Market vendor packing fresh vegetables" />
              </div>
              <div className="photo photo-top">
                <img src={photos.fish} alt="Fresh fish at the market" />
              </div>
              <div className="photo photo-bottom">
                <img src={photos.fruit} alt="Colorful fresh fruit" />
              </div>
              <div className="floating-card">
                <span>
                  <Icon name="check" size={16} />
                </span>
                <div>
                  <strong>Personal shopper</strong>
                  <small>Quality checked for you</small>
                </div>
              </div>
              <div className="fresh-stamp">
                <Icon name="leaf" />
                <strong>
                  Fresh
                  <br />
                  today
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="shell trust-grid">
            <div>
              <Icon name="shield" />
              <span>
                <strong>Suki-approved quality</strong>
                <small>Pinipili na parang ikaw</small>
              </span>
            </div>
            <div>
              <Icon name="clock" />
              <span>
                <strong>{stats[2]?.value ?? "Same-day"} delivery</strong>
                <small>From market to doorstep</small>
              </span>
            </div>
            <div>
              <Icon name="truck" />
              <span>
                <strong>Careful delivery</strong>
                <small>Freshness protected</small>
              </span>
            </div>
            <div className="rating">
              <strong>{ratingStat.value}</strong>
              <span>
                <span className="stars">★★★★★</span>
                <small>{ratingStat.label}</small>
              </span>
            </div>
          </div>
        </section>

        <section className="section shell" id="shop">
          <div className="section-heading">
            <div>
              <p className="kicker">Start your market run</p>
              <h2>Shop by category</h2>
            </div>
            <Link to="/shop">
              View all <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="categories">
            {categories.slice(0, 7).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/shop?category=${category.id}`)}
              >
                <CategoryThumb category={category} />
                <strong>{category.name}</strong>
                <small>{categoryDetail(category)}</small>
              </button>
            ))}
            <button type="button" onClick={() => navigate("/paluto")}>
              <span>
                <Icon name="sparkle" />
              </span>
              <strong>Paluto</strong>
              <small>Ready to eat</small>
            </button>
          </div>
        </section>

        <section className="shell market-banner">
          <div>
            <p className="kicker">Your market run, made easy</p>
            <h2>
              Real palengke freshness,
              <br />
              without the long lines.
            </h2>
            <p>We shop directly from trusted stalls at {marketName}.</p>
            <Link to="/shop">
              Shop {market?.name ?? "the market"} <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="market-photo">
            <img src={photos.palengke} alt="Busy local fresh market" />
          </div>
          <span className="banner-pattern"></span>
        </section>

        <section className="section shell" id="products">
          <div className="section-heading products-heading">
            <div>
              <p className="kicker">Picked fresh this morning</p>
              <h2>Featured products</h2>
            </div>
            {featuredCategories.length > 1 && (
              <div className="filter-pills">
                {["All", ...featuredCategories].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={activeCategory === item ? "active" : ""}
                    onClick={() => setActiveCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          {shownProducts.length ? (
            <div className="product-grid">
              {shownProducts.map((item) => (
                <PkProductCard
                  key={item.id}
                  item={item}
                  onView={() => navigate(`/product/${item.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="bag" size={32} />
              <h3>{marketId ? "Walang nahanap" : "Choose your market"}</h3>
              <p>
                {marketId
                  ? "Fresh items for this market will show up here."
                  : "Pick a market in the shop to see what's fresh today."}
              </p>
              <button type="button" className="btn primary" onClick={() => navigate("/shop")}>
                Go to the shop
              </button>
            </div>
          )}
        </section>

        {bestDeal && (
          <section className="deal-wrap">
            <div className="shell deal">
              <div className="deal-copy">
                <span className="deal-tag">
                  <Icon name="sparkle" size={15} /> TODAY&apos;S BEST DEAL
                </span>
                <p className="kicker">Suki savings</p>
                <h2>{bestDeal.name}</h2>
                <p>
                  Picked by our market team from {marketName}. Fresh, quality-checked, and
                  priced right for your next family meal.
                </p>
                <div className="deal-price">
                  <strong>₱{Number(bestDeal.price).toLocaleString("en-PH")}</strong>
                  <span>per {bestDeal.unit ?? "pc"}</span>
                </div>
                <button
                  type="button"
                  className="btn dark"
                  onClick={() => navigate(`/product/${bestDeal.id}`)}
                >
                  Add to cart <Icon name="arrow" size={18} />
                </button>
              </div>
              <div className="deal-image">
                <img src={bestDeal.image ?? photos.vendor} alt={bestDeal.name} />
                <span>
                  TOP<small>DEAL</small>
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="section shell split-cards" id="paluto">
          <article className="split-card paluto-card">
            <div>
              <span className="mini-icon">
                <Icon name="sparkle" />
              </span>
              <p className="kicker">Paluto</p>
              <h2>
                Pick it fresh.
                <br />
                We cook it for you.
              </h2>
              <p>
                Choose a trusted market stall and your favorite Filipino dish. Kami na bahala
                sa ingredients at luto.
              </p>
              <Link to="/paluto">
                Explore Paluto <Icon name="arrow" size={18} />
              </Link>
            </div>
            <img src={photos.fish} alt="Fresh seafood ready for Paluto" />
          </article>
          <article className="split-card recipe-card">
            <div>
              <span className="mini-icon">
                <Icon name="leaf" />
              </span>
              <p className="kicker">Cook it yourself</p>
              <h2>
                Recipe-ready
                <br />
                ingredients.
              </h2>
              <p>From adobo to sinigang, add every ingredient to your cart in one easy tap.</p>
              <Link to="/recipes">
                Browse recipes <Icon name="arrow" size={18} />
              </Link>
            </div>
            <img src={photos.carrots} alt="Fresh recipe ingredients" />
          </article>
        </section>

        <section className="how" id="how">
          <div className="shell">
            <div className="center-heading">
              <p className="kicker">Simple. Fresh. Maaasahan.</p>
              <h2>How Palengkey works</h2>
              <p>Your palengke run in three easy steps.</p>
            </div>
            <div className="steps">
              <article>
                <span className="step-number">01</span>
                <div className="step-icon">
                  <Icon name="search" size={27} />
                </div>
                <h3>Browse &amp; order</h3>
                <p>
                  Shop fresh market goods, choose your preferred weight, and tell us exactly how
                  you like it.
                </p>
              </article>
              <span className="step-line"></span>
              <article>
                <span className="step-number">02</span>
                <div className="step-icon">
                  <Icon name="bag" size={27} />
                </div>
                <h3>We shop for you</h3>
                <p>Your personal shopper handpicks every item from trusted market suki stalls.</p>
              </article>
              <span className="step-line"></span>
              <article>
                <span className="step-number">03</span>
                <div className="step-icon">
                  <Icon name="truck" size={27} />
                </div>
                <h3>Fresh delivery</h3>
                <p>Your order arrives carefully packed, fresh, and ready for your kitchen.</p>
              </article>
            </div>
          </div>
        </section>

        {featuredReviews.length > 0 && (
          <section className="section shell">
            <div className="section-heading">
              <div>
                <p className="kicker">Loved by our mga suki</p>
                <h2>Fresh stories from the community</h2>
              </div>
              <div className="suki-level">
                <Icon name="star" />
                <span>
                  <strong>
                    {ratingStat.value} {ratingStat.label}
                  </strong>
                  <small>Verified suki reviews</small>
                </span>
              </div>
            </div>
            <div className="testimonials">
              {featuredReviews.slice(0, 3).map((review, index) => (
                <article key={`${review.public_customer_name}-${index}`}>
                  <div className="stars">
                    {"★".repeat(Math.round(review.rating))}
                    {"☆".repeat(5 - Math.round(review.rating))}
                  </div>
                  <h3>“{review.comment.split(/[.!?]/)[0].trim()}.”</h3>
                  <p>{review.comment}</p>
                  <div className="person">
                    <span>{review.public_customer_name.charAt(0)}</span>
                    <div>
                      <strong>{review.public_customer_name}</strong>
                      <small>Verified suki{review.market_name ? ` · ${review.market_name}` : ""}</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
