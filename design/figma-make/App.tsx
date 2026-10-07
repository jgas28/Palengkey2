import { FormEvent, useEffect, useMemo, useState } from "react";

type IconName =
  | "arrow"
  | "bag"
  | "bell"
  | "cart"
  | "check"
  | "chevron"
  | "clock"
  | "fish"
  | "facebook"
  | "instagram"
  | "leaf"
  | "menu"
  | "message"
  | "minus"
  | "plus"
  | "search"
  | "shield"
  | "sparkle"
  | "star"
  | "truck"
  | "x";

const iconPaths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  bag: <path d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />,
  cart: <path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5H18a2 2 0 0 0 2-1.6L21 8H7M10 21h.01M18 21h.01" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  fish: <path d="M16.7 8.2C13 5.5 8 6 4 10c4 4 9 4.5 12.7 1.8L21 15V5l-4.3 3.2ZM8 10h.01" />,
  facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  leaf: <path d="M20 4C11 4 5 8 5 15c0 2 1 4 3 5 1-6 5-9 9-11-4 3-6 6-7 11 7 0 10-7 10-16Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-4A9 9 0 1 1 21 12Z" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  shield: <path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Zm-3 9 2 2 4-5" />,
  sparkle: <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />,
  star: <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3Z" />,
  truck: <path d="M3 5h11v11H3V5Zm11 4h4l3 4v3h-7V9ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const photos = {
  market: "https://images.unsplash.com/photo-1695654402840-2ced27739781?auto=format&fit=crop&w=1200&q=85",
  vendor: "https://images.unsplash.com/photo-1695654400763-2d6db6903452?auto=format&fit=crop&w=1000&q=85",
  fish: "https://images.unsplash.com/photo-1548584771-b2000f1a1c70?auto=format&fit=crop&w=900&q=85",
  fruit: "https://images.unsplash.com/photo-1765862857099-cb03e1c3de07?auto=format&fit=crop&w=900&q=85",
  carrots: "https://images.unsplash.com/photo-1581493297375-6bf56ab23719?auto=format&fit=crop&w=900&q=85",
  palengke: "https://images.unsplash.com/photo-1548585219-8eb7c1801390?auto=format&fit=crop&w=1200&q=85",
};

const products = [
  { id: 1, name: "Baguio Beans", category: "Gulay", price: 85, unit: "500g", image: photos.carrots, note: "Farm fresh" },
  { id: 2, name: "Fresh Tilapia", category: "Isda", price: 145, unit: "500g", image: photos.fish, note: "Cleaned free" },
  { id: 3, name: "Ripe Mangoes", category: "Prutas", price: 180, unit: "1kg", image: photos.fruit, note: "Sweet & golden" },
  { id: 4, name: "Native Pechay", category: "Gulay", price: 48, unit: "bundle", image: photos.vendor, note: "Harvested today" },
];

const categories = [
  { name: "Gulay", icon: "leaf" as IconName, detail: "Fresh vegetables" },
  { name: "Isda", icon: "fish" as IconName, detail: "Seafood catch" },
  { name: "Karne", icon: "bag" as IconName, detail: "Meat cuts" },
  { name: "Manok", icon: "sparkle" as IconName, detail: "Poultry" },
  { name: "Prutas", icon: "leaf" as IconName, detail: "Sweet fruits" },
  { name: "Bigas", icon: "bag" as IconName, detail: "Rice & grains" },
  { name: "Pantry", icon: "cart" as IconName, detail: "Daily staples" },
  { name: "Paluto", icon: "sparkle" as IconName, detail: "Ready to eat" },
];

function Button({ children, className = "", onClick, type = "button" }: React.PropsWithChildren<{ className?: string; onClick?: () => void; type?: "button" | "submit" }>) {
  return <button type={type} onClick={onClick} className={`btn ${className}`}>{children}</button>;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? "logo-light" : ""}`}>
      <img src="/palengkey-logo.png" alt="PalengKey" />
    </div>
  );
}

function NavLink({ to, children, onNavigate }: React.PropsWithChildren<{ to: string; onNavigate: (path: string) => void }>) {
  return <a href={to} onClick={(event) => { event.preventDefault(); onNavigate(to); }}>{children}</a>;
}

function Header({ cartCount, onNavigate }: { cartCount: number; onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="shell nav">
        <NavLink to="/" onNavigate={onNavigate}><Logo /></NavLink>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/" onNavigate={onNavigate}>Home</NavLink>
          <NavLink to="/shop" onNavigate={onNavigate}>Shop</NavLink>
          <NavLink to="/paluto" onNavigate={onNavigate}>Paluto</NavLink>
          <NavLink to="/recipes" onNavigate={onNavigate}>Recipes</NavLink>
          <NavLink to="/about" onNavigate={onNavigate}>About</NavLink>
          <NavLink to="/careers" onNavigate={onNavigate}>Careers</NavLink>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn hide-mobile" aria-label="Search"><Icon name="search" /></button>
          <button className="icon-btn hide-mobile" onClick={() => onNavigate("/notifications")} aria-label="Notifications"><Icon name="bell" /></button>
          <button className="icon-btn cart-button" onClick={() => onNavigate("/cart")} aria-label={`Cart with ${cartCount} items`}>
            <Icon name="cart" /><span className="cart-label">Cart</span>{cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <Button className="profile-link hide-mobile" onClick={() => onNavigate("/profile")}>Profile</Button>
          <Button className="login hide-mobile" onClick={() => onNavigate("/login")}>Log in</Button>
          <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label="Open menu"><Icon name={open ? "x" : "menu"} /></button>
        </div>
      </div>
      {open && <nav className="mobile-nav">
        {["Home|/", "Shop|/shop", "Cart|/cart", "Paluto|/paluto", "Recipes|/recipes", "Profile|/profile", "Orders|/orders", "Notifications|/notifications", "Support|/support", "About|/about", "Careers|/careers"].map((item) => {
          const [label, to] = item.split("|");
          return <a key={label} href={to} onClick={(event) => { event.preventDefault(); setOpen(false); onNavigate(to.split("#")[0] || "/"); if (to.includes("#")) window.setTimeout(() => document.querySelector(`#${to.split("#")[1]}`)?.scrollIntoView(), 50); }}>{label}</a>;
        })}
        <Button className="primary" onClick={() => { setOpen(false); onNavigate("/login"); }}>Log in</Button>
      </nav>}
    </header>
  );
}

type AddToCart = (name: string, quantity?: number, price?: number, instructions?: string) => void;

function ProductCard({ product, onAdd, onView }: { product: typeof products[number] & { stock?: "available" | "out" | "unavailable" }; onAdd: AddToCart; onView?: () => void }) {
  const [favorite, setFavorite] = useState(false);
  const unavailable = product.stock === "out" || product.stock === "unavailable";
  return (
    <article className={`product-card ${unavailable ? "product-disabled" : ""}`}>
      <div className={`product-image ${unavailable ? "has-status" : ""}`}>
        <img src={product.image} alt={product.name} />
        <span className="fresh-tag">{product.note}</span>
        {product.stock === "out" && <span className="stock-badge out">Out of stock</span>}
        {product.stock === "unavailable" && <span className="stock-badge unavailable">Unavailable</span>}
        <button onClick={() => setFavorite(!favorite)} className={`heart ${favorite ? "active" : ""}`} aria-label="Save product">{favorite ? "♥" : "♡"}</button>
        {onView && <button className="quick-view" onClick={onView}><Icon name="search" size={15} /> Quick view</button>}
      </div>
      <div className="product-body">
        <p className="eyebrow">{product.category}</p>
        <h3>{product.name}</h3>
        <div className="product-bottom">
          <p><strong>₱{product.price}</strong><span> / {product.unit}</span></p>
          <Button className="add" onClick={() => {
            if (unavailable) return;
            if (onView) onView();
            else onAdd(product.name, 1, product.price);
          }}>{unavailable ? (product.stock === "out" ? "Sold out" : "Unavailable") : <><Icon name="plus" size={17} /> Add</>}</Button>
        </div>
      </div>
    </article>
  );
}

const stalls = [
  {
    id: 1,
    name: "Aling Nena's Seafood Paluto",
    specialty: "Seafood classics",
    market: "Cubao Farmers Market",
    image: photos.fish,
    rating: "4.9",
    dishes: [
      { name: "Sinigang na Hipon", description: "Fresh shrimp, sampalok broth, and market vegetables", price: 389 },
      { name: "Inihaw na Pusit", description: "Grilled squid with tomato-onion stuffing", price: 349 },
      { name: "Sweet Chili Crab", description: "Market crab in a rich sweet and spicy sauce", price: 495 },
    ],
  },
  {
    id: 2,
    name: "Mang Jun's Ihawan",
    specialty: "Grilled favorites",
    market: "Cubao Farmers Market",
    image: photos.palengke,
    rating: "4.8",
    dishes: [
      { name: "Inihaw na Liempo", description: "Charcoal-grilled pork belly with house sawsawan", price: 325 },
      { name: "Chicken Inasal", description: "Achiote-marinated chicken with calamansi", price: 285 },
      { name: "Grilled Bangus", description: "Stuffed milkfish grilled over hot coals", price: 375 },
    ],
  },
  {
    id: 3,
    name: "Kusina ni Tita Mila",
    specialty: "Lutong bahay",
    market: "Cubao Farmers Market",
    image: photos.vendor,
    rating: "4.9",
    dishes: [
      { name: "Pork Adobo", description: "Classic soy-vinegar braise with garlic", price: 310 },
      { name: "Kare-Kare", description: "Beef and vegetables in savory peanut sauce", price: 425 },
      { name: "Chicken Afritada", description: "Tomato-braised chicken with fresh vegetables", price: 295 },
    ],
  },
];

const catalogProducts = [
  ...products.map((product, index) => ({ ...product, type: index === 2 ? "Value packs" : "Fresh today", deal: index === 1, stock: "available" as const })),
  { id: 5, name: "Talong", category: "Gulay", price: 65, unit: "500g", image: photos.vendor, note: "Fresh today", type: "Fresh today", deal: false, stock: "available" as const },
  { id: 6, name: "Sibuyas Tagalog", category: "Gulay", price: 92, unit: "500g", image: photos.carrots, note: "Kitchen staple", type: "Fresh today", deal: false, stock: "out" as const },
  { id: 7, name: "Bangus Dagupan", category: "Isda", price: 235, unit: "1kg", image: photos.fish, note: "Cleaned free", type: "Ready to cook", deal: true, stock: "available" as const },
  { id: 8, name: "Fresh Hipon", category: "Isda", price: 320, unit: "500g", image: photos.fish, note: "Morning catch", type: "Fresh today", deal: false, stock: "available" as const },
  { id: 9, name: "Pork Kasim", category: "Karne", price: 198, unit: "500g", image: photos.palengke, note: "Market cut", type: "Ready to cook", deal: false, stock: "available" as const },
  { id: 10, name: "Chicken Whole", category: "Manok", price: 245, unit: "1kg", image: photos.market, note: "Cleaned free", type: "Value packs", deal: true, stock: "available" as const },
  { id: 11, name: "Lakatan Banana", category: "Prutas", price: 105, unit: "1kg", image: photos.fruit, note: "Naturally sweet", type: "Fresh today", deal: false, stock: "available" as const },
  { id: 12, name: "Dinorado Rice", category: "Bigas", price: 345, unit: "5kg", image: photos.carrots, note: "Family pack", type: "Value packs", deal: false, stock: "unavailable" as const },
];

const markets = [
  { name: "Cubao Farmers Market", location: "Araneta City, Quezon City", distance: "2.4 km", eta: "90–120 min", available: true },
  { name: "Marikina Public Market", location: "Sta. Elena, Marikina City", distance: "5.8 km", eta: "120–150 min", available: true },
  { name: "Pasig Mega Market", location: "Caruncho Ave., Pasig City", distance: "7.1 km", eta: "120–150 min", available: true },
  { name: "Mandaluyong Public Market", location: "Kalentong, Mandaluyong", distance: "8.3 km", eta: "Coming soon", available: false },
];

function MarketPicker({ selected, onSelect, onClose }: { selected: string; onSelect: (market: (typeof markets)[number]) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const shown = markets.filter((market) => `${market.name} ${market.location}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="market-picker-backdrop" onClick={onClose}>
      <section className="market-picker" onClick={(event) => event.stopPropagation()}>
        <div className="picker-head"><div><p className="kicker">Choose your palengke</p><h2>Select a market</h2><p>Availability and delivery time are based on your address.</p></div><button onClick={onClose} aria-label="Close market selector"><Icon name="x" /></button></div>
        <label className="picker-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets or cities..." /></label>
        <div className="market-options">{shown.map((market) => <button className={`${selected === market.name ? "selected" : ""} ${!market.available ? "disabled" : ""}`} disabled={!market.available} onClick={() => { onSelect(market); onClose(); }} key={market.name}><span><Icon name="bag" /></span><div><strong>{market.name}</strong><p>{market.location}</p><small>{market.distance} · {market.eta}</small></div>{market.available ? <i>{selected === market.name ? <Icon name="check" size={16} /> : <Icon name="chevron" size={16} />}</i> : <b>Coming soon</b>}</button>)}</div>
        <div className="picker-note"><Icon name="truck" /><span><strong>Market-to-door delivery</strong><small>Your order is shopped and delivered from one market to keep everything fresh.</small></span></div>
      </section>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onAdd }: { product: (typeof catalogProducts)[number]; onClose: () => void; onAdd: AddToCart }) {
  const gallery = [product.image, product.category === "Isda" ? photos.fish : photos.market, photos.vendor, product.category === "Prutas" ? photos.fruit : photos.carrots];
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const discount = quantity >= 10 ? 15 : quantity >= 5 ? 10 : 0;
  const discountedUnit = Math.round(product.price * (1 - discount / 100));
  const total = discountedUnit * quantity;
  const unavailable = product.stock === "out" || product.stock === "unavailable";
  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <section className="product-modal" onClick={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Close product details"><Icon name="x" /></button>
        <div className="product-gallery">
          <div className="product-main-image"><img src={gallery[activeImage]} alt={`${product.name} view ${activeImage + 1}`} />{product.deal && <span>Best deal</span>}{product.stock === "out" && <b className="modal-stock out">Out of stock</b>}{product.stock === "unavailable" && <b className="modal-stock unavailable">Unavailable in this market</b>}</div>
          <div className="product-thumbnails">{gallery.map((image, index) => <button className={activeImage === index ? "active" : ""} onClick={() => setActiveImage(index)} key={`${image}-${index}`}><img src={image} alt="" /></button>)}</div>
        </div>
        <div className="product-details">
          <p className="eyebrow">{product.category} · {product.note}</p>
          <h2>{product.name}</h2>
          <div className="modal-price"><strong>₱{discountedUnit}</strong><span>/ {product.unit}</span>{discount > 0 && <><del>₱{product.price}</del><b>{discount}% bulk discount</b></>}</div>
          <p className="product-description">Freshly selected from a trusted Cubao Farmers Market stall. Your personal shopper checks quality before packing.</p>
          <div className="bulk-banner"><Icon name="sparkle" /><div><strong>Buy more, save more</strong><p><span>5+ items: 10% off</span><span>10+ items: 15% off</span></p></div></div>
          <div className="quantity-row"><div><strong>Quantity</strong><small>{unavailable ? "Purchasing is temporarily disabled" : `Each item is ${product.unit}`}</small></div><div className={`modal-quantity ${unavailable ? "disabled" : ""}`}><button disabled={unavailable} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" size={16} /></button><span>{quantity}</span><button disabled={unavailable} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={16} /></button></div></div>
          <label className="instruction-field">Special instructions <small>Optional</small><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Hal. hinog pero matigas, clean and slice, no plastic..." /></label>
          <div className="modal-total"><div><small>{unavailable ? "Check another market for availability" : `Total ${discount > 0 ? `· You save ₱${(product.price - discountedUnit) * quantity}` : ""}`}</small><strong>₱{total}</strong></div><Button className={`primary ${unavailable ? "disabled-action" : ""}`} onClick={() => { if (!unavailable) { onAdd(product.name, quantity, discountedUnit, instructions); onClose(); } }}>{unavailable ? (product.stock === "out" ? "Out of stock" : "Unavailable") : <><Icon name="cart" size={18} /> Add {quantity} to cart</>}</Button></div>
        </div>
      </section>
    </div>
  );
}

function ShopPage({ onAdd, onNavigate }: { onAdd: AddToCart; onNavigate: (path: string) => void }) {
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All types");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Featured");
  const [selectedProduct, setSelectedProduct] = useState<(typeof catalogProducts)[number] | null>(null);
  const [market, setMarket] = useState(markets[0]);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const shopCategories = ["All", "Gulay", "Isda", "Karne", "Manok", "Prutas", "Bigas"];
  const types = ["All types", "Fresh today", "Ready to cook", "Value packs", "Best deals"];
  const visible = useMemo(() => {
    const result = catalogProducts.filter((product) =>
      (category === "All" || product.category === category) &&
      (type === "All types" || (type === "Best deals" ? product.deal : product.type === type)) &&
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    return [...result].sort((a, b) => sort === "Price: Low to high" ? a.price - b.price : sort === "Price: High to low" ? b.price - a.price : Number(b.deal) - Number(a.deal));
  }, [category, type, query, sort]);
  return (
    <main className="inner-page shop-page">
      <section className="shop-top">
        <div className="shell shop-breadcrumb"><NavLink to="/" onNavigate={onNavigate}>Home</NavLink><Icon name="chevron" size={14} /><span>Shop</span></div>
        <div className="shell shop-tools">
          <div><button className="market-selector" onClick={() => setMarketPickerOpen(true)}><span><Icon name="bag" size={17} /></span><div><small>Shopping from</small><strong>{market.name}</strong></div><Icon name="chevron" size={16} /></button><h1>Fresh market goods</h1></div>
          <label className="catalog-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the market..." /></label>
          <label className="sort-select"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Featured</option><option>Price: Low to high</option><option>Price: High to low</option></select></label>
        </div>
      </section>
      <div className="shell mobile-category-row">{shopCategories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <div className="shell catalog-layout">
        <aside className="catalog-sidebar">
          <div><h3>Categories</h3>{shopCategories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}><span>{item}</span><small>{item === "All" ? catalogProducts.length : catalogProducts.filter((product) => product.category === item).length}</small></button>)}</div>
          <div><h3>Product type</h3>{types.map((item) => <label key={item}><input type="radio" name="type" checked={type === item} onChange={() => setType(item)} /><span>{item}</span></label>)}</div>
          <button className="clear-filters" onClick={() => { setCategory("All"); setType("All types"); setQuery(""); }}>Clear all filters</button>
        </aside>
        <section className="catalog-content">
          <article className="paluto-inline"><div><span><Icon name="sparkle" /></span><div><p className="kicker">Available from {market.name}</p><h2>Try Paluto</h2><p>Choose a stall and we’ll buy the ingredients and have your meal cooked fresh.</p></div></div><Button onClick={() => onNavigate("/paluto")}>Explore Paluto <Icon name="arrow" size={17} /></Button></article>
          <div className="catalog-meta"><p><strong>{visible.length}</strong> items found</p><div className="mobile-type-filter"><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></div></div>
          {visible.length ? <div className="catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onView={() => setSelectedProduct(product)} />)}</div> : <div className="empty"><Icon name="bag" size={34} /><h3>No market items found</h3><p>Try another category, type, or search term.</p><Button className="primary" onClick={() => { setCategory("All"); setType("All types"); setQuery(""); }}>Reset filters</Button></div>}
        </section>
      </div>
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={onAdd} />}
      {marketPickerOpen && <MarketPicker selected={market.name} onSelect={setMarket} onClose={() => setMarketPickerOpen(false)} />}
    </main>
  );
}

const recipes = [
  {
    id: 1,
    name: "Sinigang na Baboy",
    time: "55 min",
    level: "Easy",
    image: photos.vendor,
    description: "A comforting sour soup with tender pork and fresh market vegetables.",
    ingredients: ["500g pork kasim", "1 bunch kangkong", "2 tomatoes", "1 labanos", "Sitaw", "Sinigang mix"],
    steps: ["Simmer the pork with tomatoes until tender.", "Add labanos and sitaw, then cook for 8 minutes.", "Season the broth to your preferred sourness.", "Add kangkong last and serve while hot."],
    price: 438,
  },
  {
    id: 2,
    name: "Chicken Adobo",
    time: "45 min",
    level: "Easy",
    image: photos.palengke,
    description: "The Filipino family favorite with a balanced savory, tangy sauce.",
    ingredients: ["1kg whole chicken", "Soy sauce", "Cane vinegar", "1 head garlic", "Bay leaves", "Black pepper"],
    steps: ["Marinate chicken in soy sauce and garlic.", "Brown the chicken pieces in a deep pan.", "Pour in the marinade, vinegar, bay leaves, and pepper.", "Simmer uncovered until the sauce is glossy and reduced."],
    price: 365,
  },
  {
    id: 3,
    name: "Ginisang Monggo",
    time: "50 min",
    level: "Easy",
    image: photos.carrots,
    description: "Hearty mung beans with malunggay and crisp market vegetables.",
    ingredients: ["250g mung beans", "Malunggay leaves", "2 tomatoes", "1 onion", "Garlic", "Smoked fish"],
    steps: ["Boil mung beans until soft.", "Sauté garlic, onion, and tomatoes.", "Add the cooked beans and enough broth.", "Fold in malunggay and smoked fish before serving."],
    price: 218,
  },
  {
    id: 4,
    name: "Pinakbet",
    time: "35 min",
    level: "Medium",
    image: photos.fruit,
    description: "Colorful seasonal vegetables sautéed with bagoong for deep flavor.",
    ingredients: ["Ampalaya", "Kalabasa", "Sitaw", "Okra", "Eggplant", "Bagoong alamang"],
    steps: ["Sauté aromatics and bagoong.", "Add kalabasa and a splash of water.", "Layer in the remaining vegetables.", "Cover and cook just until vegetables are tender."],
    price: 285,
  },
];

function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <footer id="about">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>Ang paboritong palengke mo, online. Fresh market goods, thoughtfully picked and delivered.</p>
          <div className="socials" aria-label="Social media">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Palengkey on Facebook"><Icon name="facebook" /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Palengkey on Instagram"><Icon name="instagram" /></a>
          </div>
          <div className="store-badges"><span><small>COMING SOON ON</small>App Store</span><span><small>COMING SOON ON</small>Google Play</span></div>
        </div>
        <div><h3>Palengkey</h3><NavLink to="/about" onNavigate={onNavigate}>About us</NavLink><NavLink to="/shop" onNavigate={onNavigate}>Shop</NavLink><NavLink to="/paluto" onNavigate={onNavigate}>Paluto</NavLink><NavLink to="/recipes" onNavigate={onNavigate}>Recipes</NavLink><NavLink to="/careers" onNavigate={onNavigate}>Careers</NavLink></div>
        <div><h3>Support</h3><NavLink to="/support" onNavigate={onNavigate}>Help center</NavLink><NavLink to="/orders" onNavigate={onNavigate}>Track an order</NavLink><NavLink to="/delivery" onNavigate={onNavigate}>Delivery information</NavLink><a href="mailto:support@palengkey.ph">Contact us</a></div>
        <div><h3>Stay in the loop</h3><p>Fresh deals and market stories, straight to your inbox.</p><form className="footer-form"><input aria-label="Email address" placeholder="Your email address" /><Button aria-label="Subscribe" className="submit"><Icon name="arrow" /></Button></form></div>
      </div>
      <div className="shell footer-bottom"><span>© 2025 Palengkey. Made fresh in the Philippines.</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a></div></div>
    </footer>
  );
}

function PalutoPage({ onAdd }: { onAdd: (name: string) => void }) {
  const [selectedStall, setSelectedStall] = useState<(typeof stalls)[number] | null>(null);
  return (
    <main className="inner-page">
      <section className="page-hero paluto-hero">
        <div className="shell page-hero-grid">
          <div><p className="kicker">Cook for me</p><h1>Paluto, made simple.</h1><p>Pick a trusted stall and choose your dish. Our staff buys the freshest ingredients from the market, then the stall cooks it just the way you like.</p><a href="#stalls" className="page-cta">Choose a stall <Icon name="arrow" /></a></div>
          <div className="page-hero-image"><img src={photos.fish} alt="Fresh seafood prepared for Paluto" /><span>Fresh ingredients<br />bought per order</span></div>
        </div>
      </section>
      <section className="section shell" id="stalls">
        <div className="section-heading"><div><p className="kicker">Cubao Farmers Market</p><h2>{selectedStall ? selectedStall.name : "Choose your cooking stall"}</h2></div>{selectedStall && <Button className="outline" onClick={() => setSelectedStall(null)}>All stalls</Button>}</div>
        {!selectedStall ? (
          <div className="stall-grid">
            {stalls.map((stall) => <article className="stall-card" key={stall.id}><div className="stall-image"><img src={stall.image} alt={stall.name} /><span><Icon name="star" size={14} /> {stall.rating}</span></div><div><p className="eyebrow">{stall.specialty}</p><h3>{stall.name}</h3><p>{stall.market}</p><Button className="primary" onClick={() => { setSelectedStall(stall); window.scrollTo({ top: 520, behavior: "smooth" }); }}>View menu <Icon name="arrow" size={17} /></Button></div></article>)}
          </div>
        ) : (
          <div>
            <div className="stall-summary"><img src={selectedStall.image} alt="" /><div><span className="stars">★★★★★</span><p>{selectedStall.specialty} · Ingredients bought fresh after you order</p></div></div>
            <div className="dish-grid">{selectedStall.dishes.map((dish) => <article className="dish-card" key={dish.name}><div className="dish-icon"><Icon name="sparkle" /></div><p className="eyebrow">Cooked to order</p><h3>{dish.name}</h3><p>{dish.description}</p><div><strong>₱{dish.price}</strong><Button className="add-dish" onClick={() => onAdd(dish.name)}><Icon name="plus" size={17} /> Add order</Button></div></article>)}</div>
            <div className="paluto-note"><Icon name="bag" /><div><strong>How your Paluto order works</strong><p>The dish price includes estimated ingredients and cooking. Your shopper will confirm availability and any market-price difference before buying.</p></div></div>
          </div>
        )}
      </section>
    </main>
  );
}

function RecipesPage({ onAdd }: { onAdd: (name: string) => void }) {
  const [selected, setSelected] = useState<(typeof recipes)[number] | null>(null);
  const [query, setQuery] = useState("");
  const shown = recipes.filter((recipe) => recipe.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="inner-page">
      <section className="page-hero recipe-hero">
        <div className="shell recipe-intro"><p className="kicker">Cook it yourself</p><h1>Recipes for every Filipino table.</h1><p>Step-by-step home cooking, with every fresh ingredient ready to add to your basket.</p><div className="recipe-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sinigang, adobo, gulay..." /></div></div>
      </section>
      <section className="section shell">
        <div className="section-heading"><div><p className="kicker">Market-to-kitchen guides</p><h2>What are we cooking?</h2></div></div>
        <div className="recipe-grid">{shown.map((recipe) => <article className="full-recipe-card" key={recipe.id} onClick={() => setSelected(recipe)}><div><img src={recipe.image} alt={recipe.name} /><span>{recipe.time} · {recipe.level}</span></div><section><h3>{recipe.name}</h3><p>{recipe.description}</p><button onClick={() => setSelected(recipe)}>View recipe <Icon name="arrow" size={17} /></button></section></article>)}</div>
      </section>
      {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="recipe-drawer" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setSelected(null)} aria-label="Close recipe"><Icon name="x" /></button><div className="drawer-photo"><img src={selected.image} alt={selected.name} /></div><div className="drawer-content"><p className="kicker">{selected.time} · {selected.level}</p><h2>{selected.name}</h2><p>{selected.description}</p><h3>Fresh ingredients</h3><ul>{selected.ingredients.map((ingredient) => <li key={ingredient}><Icon name="check" size={15} />{ingredient}</li>)}</ul><h3>How to cook</h3><ol>{selected.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></div><div className="drawer-action"><div><small>Ingredient bundle</small><strong>₱{selected.price}</strong></div><Button className="primary" onClick={() => { onAdd(`${selected.name} ingredients`); setSelected(null); }}>Add all ingredients <Icon name="cart" size={18} /></Button></div></aside></div>}
    </main>
  );
}

function CareersPage() {
  return <main className="inner-page"><section className="page-hero careers-hero"><div className="shell simple-page"><p className="kicker">Join our team</p><h1>Help us bring the palengke closer.</h1><p>We’re building a fresher, fairer way to shop local. Join a team supporting shoppers, market vendors, riders, and Filipino families.</p><a className="page-cta" href="mailto:careers@palengkey.ph">See open roles <Icon name="arrow" /></a></div></section><section className="section shell jobs"><div><p className="kicker">Open positions</p><h2>Grow with Palengkey</h2></div>{["Market Operations Lead", "Customer Experience Specialist", "Mobile Product Designer"].map((job) => <article key={job}><div><h3>{job}</h3><p>Metro Manila · Full-time</p></div><a href={`mailto:careers@palengkey.ph?subject=${job}`}>Apply <Icon name="arrow" /></a></article>)}</section></main>;
}

type CartLine = { id: number; name: string; price: number; quantity: number; instructions?: string };

function CartPage({ items, onQuantity, onRemove, onNavigate }: { items: CartLine[]; onQuantity: (id: number, change: number) => void; onRemove: (id: number) => void; onNavigate: (path: string) => void }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cutoffReached = new Date().getHours() >= 15;
  return (
    <main className="inner-page account-bg">
      <div className="shell page-title"><p className="kicker">Cubao Farmers Market</p><h1>Your market basket</h1><p>Fresh items reserved once you proceed to checkout.</p></div>
      <div className="shell cart-layout">
        <section className="cart-list">
          <div className={`notice ${cutoffReached ? "cutoff-reached" : ""}`}><Icon name="clock" /><div><strong>{cutoffReached ? "Same-day cutoff has passed" : "Order before 3:00 PM"}</strong><p>{cutoffReached ? "No worries—choose Order Later at checkout for the next available market run." : "For same-day delivery from your selected market."}</p></div>{cutoffReached && <span>Order later</span>}</div>
          {items.length ? items.map((item) => <article className="cart-line" key={item.id}><div className="cart-thumb"><Icon name={item.name.toLowerCase().includes("fish") || item.name.toLowerCase().includes("tilapia") ? "fish" : "leaf"} /></div><div className="cart-info"><p className="eyebrow">Fresh market item</p><h3>{item.name}</h3>{item.instructions && <small>Note: {item.instructions}</small>}<button onClick={() => onRemove(item.id)}>Remove</button></div><div className="quantity"><button onClick={() => onQuantity(item.id, -1)}><Icon name="minus" size={15} /></button><span>{item.quantity}</span><button onClick={() => onQuantity(item.id, 1)}><Icon name="plus" size={15} /></button></div><strong>₱{item.price * item.quantity}</strong></article>) : <div className="empty"><Icon name="bag" size={34} /><h3>Your basket is empty</h3><p>Fresh finds are waiting at the market.</p><Button className="primary" onClick={() => onNavigate("/")}>Start shopping</Button></div>}
          <button className="continue-link" onClick={() => onNavigate("/")}><Icon name="arrow" size={17} /> Continue shopping</button>
        </section>
        <aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>₱{subtotal}</strong></div><div><span>Service fee</span><strong>₱{items.length ? 39 : 0}</strong></div><div><span>Delivery fee</span><small>Calculated at checkout</small></div><hr /><div className="summary-total"><span>Estimated total</span><strong>₱{items.length ? subtotal + 39 : 0}</strong></div><Button className="primary checkout-button" onClick={() => items.length && onNavigate("/checkout")}>{cutoffReached ? "Schedule order" : "Proceed to checkout"} <Icon name="arrow" size={18} /></Button>{cutoffReached && <div className="later-hint"><Icon name="clock" size={14} /><span>Next available delivery starts tomorrow morning.</span></div>}<p><Icon name="shield" size={14} /> Secure checkout and freshness guarantee</p></aside>
      </div>
    </main>
  );
}

function CheckoutPage({ items, onNavigate }: { items: CartLine[]; onNavigate: (path: string) => void }) {
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState("Cash on Delivery");
  const cutoffReached = new Date().getHours() >= 15;
  const [deliveryTiming, setDeliveryTiming] = useState(cutoffReached ? "later" : "today");
  const [deliveryDate, setDeliveryDate] = useState("Tomorrow");
  const [deliverySlot, setDeliverySlot] = useState("8:00–10:00 AM");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!items.length) return <main className="inner-page account-bg"><div className="shell page-title"><h1>No items to checkout</h1><Button className="primary" onClick={() => onNavigate("/")}>Shop now</Button></div></main>;
  return (
    <main className="inner-page account-bg">
      <div className="shell page-title compact"><p className="kicker">Secure checkout</p><h1>Complete your order</h1></div>
      <div className="shell checkout-progress">{["Details", "Payment", "Confirm"].map((label, index) => <div className={step >= index + 1 ? "active" : ""} key={label}><span>{step > index + 1 ? <Icon name="check" size={15} /> : index + 1}</span><strong>{label}</strong></div>)}</div>
      <div className="shell checkout-layout">
        <section className="checkout-card">
          {step === 1 && <div><p className="kicker">Delivery details</p><h2>Where should we deliver?</h2><div className="address-choice"><span><Icon name="truck" /></span><div><strong>Home</strong><p>Unit 4B, 21 Aurora Blvd., Cubao, Quezon City</p><small>Maria Santos · 0917 123 4567</small></div><button>Change</button></div>{cutoffReached && <div className="checkout-cutoff"><Icon name="clock" /><div><strong>Same-day ordering is closed</strong><p>The market cutoff was 3:00 PM. Please schedule your order for a future slot.</p></div></div>}<div className="delivery-timing"><strong>When would you like your order?</strong><div>{!cutoffReached && <button className={deliveryTiming === "today" ? "active" : ""} onClick={() => setDeliveryTiming("today")}><Icon name="truck" /><span><strong>Deliver today</strong><small>As early as 5:00 PM</small></span></button>}<button className={deliveryTiming === "later" ? "active" : ""} onClick={() => setDeliveryTiming("later")}><Icon name="clock" /><span><strong>Order later</strong><small>Choose a date and time</small></span></button></div></div>{deliveryTiming === "later" && <div className="slot-picker"><label>Delivery date<select value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)}><option>Tomorrow</option><option>In 2 days</option><option>This weekend</option></select></label><div><strong>Available time slots</strong><section>{["8:00–10:00 AM", "10:00 AM–12:00 PM", "1:00–3:00 PM", "3:00–5:00 PM"].map((slot) => <button className={deliverySlot === slot ? "active" : ""} onClick={() => setDeliverySlot(slot)} key={slot}>{slot}</button>)}</section></div></div>}<label>Delivery instructions<textarea placeholder="Landmark, gate color, or instructions for your rider" /></label><Button className="primary next-button" onClick={() => setStep(2)}>Continue to payment <Icon name="arrow" /></Button></div>}
          {step === 2 && <div><p className="kicker">Payment</p><h2>Choose a payment method</h2><div className="payment-list">{["Cash on Delivery", "GCash", "Maya", "QR Ph", "Visa / Mastercard", "BPI Online"].map((method) => <label className={payment === method ? "selected" : ""} key={method}><input type="radio" name="payment" checked={payment === method} onChange={() => setPayment(method)} /><span>{method.slice(0, 2).toUpperCase()}</span><strong>{method}</strong><small>{method === "Cash on Delivery" ? "Pay your rider when the order arrives" : "Secure online payment"}</small></label>)}</div><div className="step-actions"><Button className="outline" onClick={() => setStep(1)}>Back</Button><Button className="primary" onClick={() => setStep(3)}>Review order <Icon name="arrow" /></Button></div></div>}
          {step === 3 && <div><p className="kicker">Review and confirm</p><h2>Everything looks fresh.</h2><div className="review-block"><div><span>Deliver to</span><strong>Maria Santos</strong><p>Unit 4B, 21 Aurora Blvd., Cubao, Quezon City</p></div><div><span>Payment</span><strong>{payment}</strong></div><div><span>Delivery</span><strong>{deliveryTiming === "later" ? `${deliveryDate}, ${deliverySlot}` : "Today, 5:00–7:00 PM"}</strong>{deliveryTiming === "later" && <p>Scheduled Order Later delivery</p>}</div></div><div className="step-actions"><Button className="outline" onClick={() => setStep(2)}>Back</Button><Button className="confirm-button" onClick={() => onNavigate("/checkout/confirmation")}><Icon name="check" /> Confirm order</Button></div></div>}
        </section>
        <aside className="order-summary checkout-summary"><h2>Your order</h2>{items.map((item) => <div className="mini-line" key={item.id}><span>{item.quantity}× {item.name}</span><strong>₱{item.price * item.quantity}</strong></div>)}<hr /><div><span>Subtotal</span><strong>₱{subtotal}</strong></div><div><span>Service fee</span><strong>₱39</strong></div><div><span>Delivery</span><strong>₱59</strong></div><div className="summary-total"><span>Total</span><strong>₱{subtotal + 98}</strong></div></aside>
      </div>
    </main>
  );
}

function ConfirmationPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <main className="inner-page account-bg"><section className="confirmation shell"><span><Icon name="check" size={38} /></span><p className="kicker">Order confirmed</p><h1>Salamat, Maria!</h1><p>Your market shopper is getting ready. We’ll notify you when they start picking your fresh items.</p><div><small>Order number</small><strong>PLK-2025-1048</strong><small>Estimated delivery</small><strong>Today, 5:00–7:00 PM</strong></div><Button className="primary" onClick={() => onNavigate("/orders/PLK-2025-1048")}>Track your order <Icon name="arrow" /></Button><button onClick={() => onNavigate("/")}>Back to home</button></section></main>;
}

function AuthPage({ initialMode, onNavigate }: { initialMode: "login" | "register"; onNavigate: (path: string) => void }) {
  const [mode, setMode] = useState(initialMode);
  return <main className="auth-page"><section className="auth-photo"><img src={photos.market} alt="Fresh market produce and local shoppers" /><div><Logo light /><blockquote>“Your trusted palengke, now closer to home.”</blockquote></div></section><section className="auth-panel"><div className="auth-card"><p className="kicker">{mode === "login" ? "Welcome back, suki" : "Join Palengkey"}</p><h1>{mode === "login" ? "Log in to your account" : "Create your account"}</h1><p>{mode === "login" ? "Track orders, save addresses, and enjoy a faster checkout." : "Fresh market shopping starts here."}</p><Button className="social-login">G <span>Continue with Google</span></Button><div className="divider"><span>or continue with email</span></div>{mode === "register" && <label>Full name<input placeholder="Juan Dela Cruz" /></label>}<label>Email address<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="At least 8 characters" /></label><Button className="primary auth-submit" onClick={() => onNavigate("/profile")}>{mode === "login" ? "Log in" : "Create account"}</Button><p className="auth-switch">{mode === "login" ? "New to Palengkey?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Log in"}</button></p><button className="guest" onClick={() => onNavigate("/")}>← Continue as guest</button></div></section></main>;
}

const sampleOrders = [
  { id: "PLK-2025-1048", date: "Today, 2:34 PM", status: "Confirmed", items: "5 market items", total: "₱1,286" },
  { id: "PLK-2025-0981", date: "May 18, 2025", status: "Delivered", items: "8 market items", total: "₱1,842" },
  { id: "PLK-2025-0914", date: "May 4, 2025", status: "Delivered", items: "3 market items", total: "₱764" },
];

function OrdersPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <main className="inner-page account-bg"><div className="shell page-title"><p className="kicker">My purchases</p><h1>Order history</h1><p>Track active deliveries and look back at previous market runs.</p></div><section className="shell orders-list">{sampleOrders.map((order) => <article key={order.id} onClick={() => onNavigate(`/orders/${order.id}`)}><div className="order-icon"><Icon name="bag" /></div><div><small>{order.id}</small><h3>{order.items}</h3><p>{order.date}</p></div><span className={`status ${order.status.toLowerCase()}`}>{order.status}</span><strong>{order.total}</strong><button aria-label={`View order ${order.id}`}><Icon name="chevron" /></button></article>)}</section></main>;
}

function OrderTrackingPage({ orderId, onNavigate }: { orderId: string; onNavigate: (path: string) => void }) {
  const active = orderId === "PLK-2025-1048";
  const timeline = [
    { title: "Order received", detail: "We received your market list.", time: "2:34 PM", done: true },
    { title: "Confirmed", detail: "Your shopper, Carlo, accepted the order.", time: "2:39 PM", done: true },
    { title: "Shopping at the market", detail: "Fresh items are being selected now.", time: active ? "In progress" : "3:05 PM", done: true, current: active },
    { title: "Out for delivery", detail: "Your rider will bring the order to you.", time: active ? "Up next" : "4:18 PM", done: !active },
    { title: "Delivered", detail: "Order received at your doorstep.", time: active ? "Est. 5:00 PM" : "4:52 PM", done: !active },
  ];
  return (
    <main className="inner-page account-bg">
      <div className="shell tracking-head"><button onClick={() => onNavigate("/orders")}><Icon name="arrow" size={17} /> All orders</button><div><p className="kicker">Order {orderId}</p><h1>{active ? "Your shopper is at the market" : "Order delivered"}</h1><p>{active ? "Carlo is handpicking your fresh items at Cubao Farmers Market." : "This market run was completed successfully."}</p></div><span className={`status ${active ? "confirmed" : "delivered"}`}>{active ? "Shopping" : "Delivered"}</span></div>
      <div className="shell tracking-layout">
        <section className="tracking-main">
          <div className="tracking-map">
            <span className="road road-one"></span><span className="road road-two"></span><span className="road road-three"></span>
            <div className="map-market"><Icon name="bag" /><small>Cubao Farmers Market</small></div>
            <div className="map-route"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div className="map-home"><Icon name="truck" /><small>Your home</small></div>
            <div className="eta-card"><small>Estimated arrival</small><strong>{active ? "5:00–5:30 PM" : "Delivered at 4:52 PM"}</strong><span><Icon name="truck" size={14} /> 2.4 km away</span></div>
          </div>
          <article className="rider-card"><span>CR</span><div><small>Your personal shopper</small><strong>Carlo Reyes</strong><p>4.9 rating · 382 market runs</p></div><button onClick={() => onNavigate("/support/chat")}><Icon name="message" size={17} /> Message</button></article>
          <article className="tracking-items"><div className="tracking-section-title"><h2>Order items</h2><span>5 items</span></div>{[["Fresh Tilapia", "500g", "₱145"], ["Baguio Beans", "500g", "₱85"], ["Native Pechay", "1 bundle", "₱48"], ["Ripe Mangoes", "1kg", "₱180"], ["Pork Kasim", "500g", "₱198"]].map(([name, unit, price]) => <div className="tracked-item" key={name}><span><Icon name={name.includes("Tilapia") ? "fish" : "leaf"} /></span><div><strong>{name}</strong><small>{unit}</small></div><b>{price}</b></div>)}<div className="tracking-totals"><p><span>Subtotal</span><strong>₱656</strong></p><p><span>Service and delivery fees</span><strong>₱98</strong></p><p><span>Total</span><strong>₱754</strong></p></div></article>
        </section>
        <aside className="tracking-timeline"><h2>Order progress</h2>{timeline.map((event) => <div className={`${event.done ? "done" : ""} ${event.current ? "current" : ""}`} key={event.title}><span>{event.done ? <Icon name="check" size={14} /> : ""}</span><section><strong>{event.title}</strong><p>{event.detail}</p><small>{event.time}</small></section></div>)}<div className="delivery-address"><Icon name="truck" /><div><small>Delivering to</small><strong>Home</strong><p>Unit 4B, 21 Aurora Blvd., Cubao, Quezon City</p></div></div><Button className="support-order" onClick={() => onNavigate("/support")}>Need help with this order?</Button></aside>
      </div>
    </main>
  );
}

function ProfilePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const menu = [["My orders", "Track active and past deliveries", "/orders"], ["Saved addresses", "Manage your delivery locations", "/addresses"], ["Vouchers", "Available promos and rewards", "/vouchers"], ["Notifications", "Order and offer preferences", "/notifications"], ["Help & support", "FAQs and chat with our team", "/support"]];
  return <main className="inner-page account-bg"><section className="profile-hero"><div className="shell profile-head"><span>MS</span><div><small>Verified suki</small><h1>Maria Santos</h1><p>0917 123 4567 · maria@example.com</p></div><Button className="outline">Edit profile</Button></div></section><div className="shell profile-stats"><article><small>Total orders</small><strong>24</strong></article><article><small>Total spent</small><strong>₱18,450</strong></article><article><small>Saved addresses</small><strong>3</strong></article></div><div className="shell profile-layout"><section><div className="profile-section-title"><h2>Recent order</h2><button onClick={() => onNavigate("/orders")}>View all</button></div><article className="recent-order"><div><span className="status confirmed">Confirmed</span><h3>PLK-2025-1048</h3><p>5 items · Today, 2:34 PM</p></div><strong>₱1,286</strong></article></section><section className="settings"><h2>Account settings</h2>{menu.map(([label, description, to]) => <button key={label} onClick={() => to !== "#" && onNavigate(to)}><span><Icon name={label.includes("order") ? "bag" : label.includes("support") ? "bell" : "shield"} /></span><div><strong>{label}</strong><small>{description}</small></div><Icon name="chevron" /></button>)}<button className="signout" onClick={() => onNavigate("/login")}>Sign out of this device</button></section></div></main>;
}

function AddressesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [adding, setAdding] = useState(false);
  const addresses = [
    { label: "Home", address: "Unit 4B, 21 Aurora Blvd., Cubao, Quezon City", contact: "Maria Santos · 0917 123 4567", primary: true },
    { label: "Office", address: "7F Cyberpark Tower 1, Araneta City, Quezon City", contact: "Maria Santos · 0917 123 4567", primary: false },
    { label: "Nanay's House", address: "18 P. Tuazon Blvd., Project 4, Quezon City", contact: "Luz Santos · 0918 555 0182", primary: false },
  ];
  return <main className="inner-page account-bg"><div className="shell page-title page-title-action"><div><p className="kicker">Delivery locations</p><h1>Saved addresses</h1><p>Choose where your market goods should be delivered.</p></div><Button className="primary" onClick={() => setAdding(true)}><Icon name="plus" /> Add address</Button></div><section className="shell address-grid">{addresses.map((address) => <article key={address.label}><div className="address-map"><span className="road road-one"></span><span className="road road-two"></span><i><Icon name="truck" /></i></div><div className="address-card-body"><div><span><Icon name="shield" size={18} /></span><div><h2>{address.label}</h2>{address.primary && <small>Default</small>}</div></div><p>{address.address}</p><small>{address.contact}</small><div className="address-actions"><button>Edit</button><button>Remove</button></div></div></article>)}</section>{adding && <div className="drawer-backdrop" onClick={() => setAdding(false)}><aside className="address-sheet" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setAdding(false)}><Icon name="x" /></button><p className="kicker">New delivery location</p><h2>Add an address</h2><div className="address-pin-map"><span><Icon name="truck" /></span><p>Drag the pin to your exact location</p></div><div className="address-form"><label>Address label<input placeholder="Home, Office, or another label" /></label><label>Complete address<textarea placeholder="House/unit, street, barangay, city" /></label><div><label>Recipient name<input placeholder="Full name" /></label><label>Mobile number<input placeholder="09XX XXX XXXX" /></label></div><label>Delivery notes<input placeholder="Landmark, floor, or gate instructions" /></label></div><Button className="primary" onClick={() => setAdding(false)}>Save address <Icon name="check" /></Button></aside></div>}<button className="back-profile" onClick={() => onNavigate("/profile")}><Icon name="arrow" /> Back to profile</button></main>;
}

function VouchersPage() {
  const [applied, setApplied] = useState("");
  const vouchers = [
    { code: "SUKI100", title: "₱100 off your market run", detail: "Minimum spend of ₱1,000", expiry: "Valid until June 30", color: "teal" },
    { code: "FRESH50", title: "₱50 off fresh produce", detail: "For Gulay and Prutas orders over ₱500", expiry: "Valid until June 15", color: "amber" },
    { code: "PALUTO20", title: "20% off Paluto cooking fees", detail: "Maximum discount of ₱150", expiry: "Valid this weekend", color: "dark" },
  ];
  return <main className="inner-page account-bg"><div className="shell page-title"><p className="kicker">Suki rewards</p><h1>Vouchers & promos</h1><p>Save more on your next market run.</p></div><section className="shell voucher-layout"><div className="voucher-input"><Icon name="sparkle" /><input placeholder="Enter voucher code" /><Button className="primary">Apply code</Button></div><div className="voucher-grid">{vouchers.map((voucher) => <article className={`voucher-card ${voucher.color}`} key={voucher.code}><div><span><Icon name="sparkle" /></span><small>{voucher.expiry}</small></div><h2>{voucher.title}</h2><p>{voucher.detail}</p><div className="voucher-actions"><code>{voucher.code}</code><button className={applied === voucher.code ? "applied" : ""} onClick={() => setApplied(voucher.code)}>{applied === voucher.code ? "Applied" : "Use voucher"}</button></div></article>)}</div><div className="voucher-note"><Icon name="shield" /><p>Vouchers apply at checkout. Only one voucher can be used per order unless otherwise stated.</p></div></section></main>;
}

function NotificationsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [read, setRead] = useState<number[]>([4]);
  const notifications = [
    { id: 1, type: "order", title: "Your shopper is at the market", text: "Carlo has started selecting items for order PLK-2025-1048.", time: "5 min ago", to: "/orders/PLK-2025-1048" },
    { id: 2, type: "deal", title: "Fresh deal for our mga suki", text: "Get 10% off a bulk order of fresh tilapia today.", time: "1 hour ago", to: "/shop" },
    { id: 3, type: "payment", title: "Payment confirmed", text: "We received your payment of ₱1,286.", time: "2 hours ago", to: "/orders/PLK-2025-1048" },
    { id: 4, type: "delivery", title: "Order delivered", text: "Your previous market run arrived at 4:52 PM.", time: "May 18", to: "/orders/PLK-2025-0981" },
  ];
  return <main className="inner-page account-bg"><div className="shell page-title page-title-action"><div><p className="kicker">Updates</p><h1>Notifications</h1><p>Order activity, account updates, and fresh deals.</p></div><button className="mark-read" onClick={() => setRead(notifications.map((item) => item.id))}>Mark all as read</button></div><section className="shell notification-list">{notifications.map((notification) => <article className={read.includes(notification.id) ? "read" : ""} key={notification.id} onClick={() => { setRead((current) => [...current, notification.id]); onNavigate(notification.to); }}><span><Icon name={notification.type === "order" ? "bag" : notification.type === "deal" ? "sparkle" : notification.type === "delivery" ? "truck" : "shield"} /></span><div><h2>{notification.title}</h2><p>{notification.text}</p><small>{notification.time}</small></div>{!read.includes(notification.id) && <i></i>}<Icon name="chevron" /></article>)}</section></main>;
}

function AboutPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <main className="inner-page"><section className="about-hero"><div className="shell about-grid"><div><p className="kicker">Our story</p><h1>Fresh from the market. Built for Filipino families.</h1><p>Palengkey connects neighborhood markets, trusted vendors, personal shoppers, and riders in one thoughtful experience.</p><Button className="primary" onClick={() => onNavigate("/shop")}>Shop the palengke <Icon name="arrow" /></Button></div><img src={photos.market} alt="Local market shopper receiving fresh vegetables" /></div></section><section className="section shell values"><div><p className="kicker">Why Palengkey</p><h2>Keeping local markets at the heart of everyday life.</h2></div><div>{[["Freshness first", "Every order is handpicked from trusted market stalls."], ["Fair for vendors", "We help local sellers reach more Filipino households."], ["Made for real life", "From detailed cuts to Paluto, shopping works the way the palengke does."]].map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section></main>;
}

function DeliveryPage() {
  return <main className="inner-page account-bg"><section className="delivery-hero"><div className="shell"><p className="kicker">Delivery information</p><h1>From the palengke to your doorstep.</h1><p>Everything you need to know about areas, timing, fees, and freshness.</p></div></section><section className="section shell delivery-content"><aside><a href="#areas">Delivery areas</a><a href="#timing">Timing & cutoff</a><a href="#fees">Delivery fees</a><a href="#freshness">Freshness guarantee</a></aside><div>{[["areas", "Where we deliver", "We currently serve selected areas in Quezon City, Marikina, Pasig, Mandaluyong, and nearby Metro Manila neighborhoods. Availability depends on your selected market and delivery address."], ["timing", "Timing and cutoff", "Same-day orders are accepted until 3:00 PM. After cutoff, use Order Later to choose the next available date and delivery window. Live ETA appears once your shopper starts."], ["fees", "How delivery fees work", "Fees are calculated using market distance, order size, and delivery demand. Your exact delivery fee appears before confirmation, with no hidden charges."], ["freshness", "Our freshness guarantee", "If an item arrives damaged or below quality expectations, contact Support with a photo. Eligible items can be replaced or refunded after review."]].map(([id, title, text]) => <article id={id} key={id}><span><Icon name={id === "timing" ? "clock" : id === "freshness" ? "leaf" : "truck"} /></span><div><h2>{title}</h2><p>{text}</p></div></article>)}</div></section></main>;
}

function SupportPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [sent, setSent] = useState(false);
  return <main className="inner-page account-bg"><section className="support-hero"><div className="shell"><p className="kicker">We’re here to help</p><h1>Kumusta? How can we help?</h1><p>Find a quick answer or send a message to our customer care team.</p></div></section><div className="shell support-layout"><section><p className="kicker">Frequently asked questions</p><h2>Quick answers</h2>{["Where is my order?", "How are fresh items weighed?", "Can I change or cancel an order?", "What if an item is unavailable?", "How does Paluto pricing work?"].map((question) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>Our customer care team and your personal shopper will keep you updated in real time. For order-specific help, send us a message with your order number.</p></details>)}</section><aside className="support-card"><span><Icon name="message" /></span><h2>Chat with customer care</h2><p>Get instant automated answers from Palengkey Assist, or leave a ticket for our team.</p><Button className="chat-now" onClick={() => onNavigate("/support/chat")}><Icon name="message" /> Start support chat <Icon name="arrow" /></Button><div className="support-divider"><span>or create a ticket</span></div>{sent ? <div className="sent-message"><Icon name="check" /><strong>Message sent</strong><p>Ticket #SUP-1842 has been created.</p></div> : <><label>Order number <input placeholder="Optional" /></label><label>How can we help? <textarea placeholder="Tell us what happened..." /></label><Button className="primary" onClick={() => setSent(true)}>Send message <Icon name="arrow" /></Button></>}</aside></div></main>;
}

type ChatMessage = { id: number; sender: "bot" | "user"; text: string; time: string };

const supportReplies = [
  { keywords: ["order", "track", "where"], reply: "You can track your active order from My Orders. For order PLK-2025-1048, your shopper is currently selecting items at Cubao Farmers Market and delivery is estimated between 5:00–5:30 PM." },
  { keywords: ["late", "delivery", "rider"], reply: "I’m sorry about the wait. Delivery times can shift with market queues and traffic. Your live tracking page shows the latest ETA. If it is over 30 minutes late, I can create a priority rider ticket." },
  { keywords: ["cancel", "change"], reply: "You may change or cancel an order before your shopper starts buying. Once shopping begins, please send your order number and I’ll connect you with our customer care team." },
  { keywords: ["refund", "missing", "damaged", "quality"], reply: "We have a freshness guarantee. Please share the affected item and order number. Keep a photo of the item, and our team can review a replacement or refund." },
  { keywords: ["payment", "gcash", "maya", "card", "qr"], reply: "Palengkey accepts Cash on Delivery, GCash, Maya, QR Ph, Visa/Mastercard, and supported online banks. Pending online payments usually update within 10 minutes." },
  { keywords: ["paluto", "cook", "stall"], reply: "For Paluto, choose a stall and dish first. Our staff buys the fresh ingredients, then the selected stall cooks them. The shown price includes estimated ingredients and cooking." },
  { keywords: ["market", "available", "stock"], reply: "Product availability depends on your selected market. Try the Market Selector in Shop to compare Cubao, Marikina, and Pasig inventory." },
  { keywords: ["cutoff", "later", "schedule"], reply: "Same-day market orders close at 3:00 PM. After cutoff, choose Order Later during checkout and select an available delivery date and time slot." },
];

function SupportChatPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 1, sender: "bot", text: "Kumusta, Maria! I’m Palengkey Assist. Ask me about your order, delivery, payment, Paluto, or product availability.", time: "Now" }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const sendMessage = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { id: Date.now(), sender: "user", text: clean, time: "Now" }]);
    setInput("");
    setTyping(true);
    const lower = clean.toLowerCase();
    const match = supportReplies.find((item) => item.keywords.some((keyword) => lower.includes(keyword)));
    const reply = match?.reply ?? "Thanks for sharing that. I don’t have an exact automated answer, but I can create a support ticket and a customer care specialist will reply within 5 minutes.";
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: Date.now() + 1, sender: "bot", text: reply, time: "Now" }]);
      setTyping(false);
    }, 700);
  };
  const quickReplies = ["Where is my order?", "Payment problem", "Missing item", "Paluto help"];
  return (
    <main className="inner-page chat-page">
      <div className="shell chat-shell">
        <header className="chat-header"><button onClick={() => onNavigate("/support")}><Icon name="arrow" /></button><span><Icon name="message" /></span><div><strong>Palengkey Assist</strong><small><i></i> Online · Instant automated replies</small></div><Button onClick={() => onNavigate("/support")}>Help center</Button></header>
        <section className="chat-messages"><div className="chat-date">Today</div>{messages.map((message) => <article className={message.sender} key={message.id}>{message.sender === "bot" && <span>PA</span>}<div><p>{message.text}</p><small>{message.time}</small></div></article>)}{typing && <article className="bot typing"><span>PA</span><div><i></i><i></i><i></i></div></article>}</section>
        <div className="quick-replies">{quickReplies.map((reply) => <button onClick={() => sendMessage(reply)} key={reply}>{reply}</button>)}</div>
        <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}><button type="button" aria-label="Add attachment"><Icon name="plus" /></button><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your message..." aria-label="Chat message" /><Button type="submit" className="send-chat"><Icon name="arrow" /></Button></form>
        <div className="chat-safety"><Icon name="shield" size={13} /> Automated answers are based on Palengkey support policies. A human specialist can step in when needed.</div>
      </div>
    </main>
  );
}

function App() {
  const [cartItems, setCartItems] = useState<CartLine[]>([
    { id: 1, name: "Baguio Beans", price: 85, quantity: 1 },
    { id: 2, name: "Fresh Tilapia", price: 145, quantity: 1 },
  ]);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [path, setPath] = useState(window.location.pathname);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const filtered = useMemo(() => products.filter((product) =>
    (activeCategory === "All" || product.category === activeCategory) &&
    product.name.toLowerCase().includes(search.toLowerCase())
  ), [activeCategory, search]);

  const addToCart: AddToCart = (name, quantity = 1, price, instructions) => {
    const knownPrice = price ?? products.find((product) => product.name === name)?.price ??
      recipes.find((recipe) => name.includes(recipe.name))?.price ??
      stalls.flatMap((stall) => stall.dishes).find((dish) => dish.name === name)?.price ?? 299;
    setCartItems((current) => {
      const existing = current.find((item) => item.name === name && item.instructions === instructions);
      if (existing) return current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + quantity, price: knownPrice } : item);
      return [...current, { id: Date.now(), name, price: knownPrice, quantity, instructions }];
    });
    setToast(`${quantity}× ${name} added to your basket`);
    window.setTimeout(() => setToast(""), 2600);
  };

  const navigate = (nextPath: string) => {
    const normalized = nextPath || "/";
    window.history.pushState({}, "", normalized);
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeQuantity = (id: number, change: number) => {
    setCartItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item));
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
  };

  const interiorPaths = ["/shop", "/paluto", "/recipes", "/careers", "/cart", "/checkout", "/checkout/confirmation", "/login", "/register", "/profile", "/orders", "/addresses", "/vouchers", "/notifications", "/about", "/delivery", "/support", "/support/chat"];
  if (interiorPaths.includes(path) || path.startsWith("/orders/")) {
    if (path === "/login" || path === "/register") return <AuthPage initialMode={path === "/login" ? "login" : "register"} onNavigate={navigate} />;
    return (
      <div>
        <Header cartCount={cartCount} onNavigate={navigate} />
        {path === "/shop" && <ShopPage onAdd={addToCart} onNavigate={navigate} />}
        {path === "/paluto" && <PalutoPage onAdd={addToCart} />}
        {path === "/recipes" && <RecipesPage onAdd={addToCart} />}
        {path === "/careers" && <CareersPage />}
        {path === "/cart" && <CartPage items={cartItems} onQuantity={changeQuantity} onRemove={(id) => setCartItems((current) => current.filter((item) => item.id !== id))} onNavigate={navigate} />}
        {path === "/checkout" && <CheckoutPage items={cartItems} onNavigate={navigate} />}
        {path === "/checkout/confirmation" && <ConfirmationPage onNavigate={navigate} />}
        {path === "/profile" && <ProfilePage onNavigate={navigate} />}
        {path === "/orders" && <OrdersPage onNavigate={navigate} />}
        {path.startsWith("/orders/") && <OrderTrackingPage orderId={decodeURIComponent(path.split("/").pop() || "")} onNavigate={navigate} />}
        {path === "/addresses" && <AddressesPage onNavigate={navigate} />}
        {path === "/vouchers" && <VouchersPage />}
        {path === "/notifications" && <NotificationsPage onNavigate={navigate} />}
        {path === "/about" && <AboutPage onNavigate={navigate} />}
        {path === "/delivery" && <DeliveryPage />}
        {path === "/support" && <SupportPage onNavigate={navigate} />}
        {path === "/support/chat" && <SupportChatPage onNavigate={navigate} />}
        {path !== "/support/chat" && <Footer onNavigate={navigate} />}
        {path !== "/support/chat" && <button className="chat" onClick={() => navigate("/support/chat")} aria-label="Chat with support"><span></span><Icon name="message" /></button>}
        {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
      </div>
    );
  }

  return (
    <div id="top">
      <Header cartCount={cartCount} onNavigate={navigate} />
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="location-pill"><span></span> Now delivering from Cubao Farmers Market</div>
              <h1>Your palengke,<br /><em>delivered fresh.</em></h1>
              <p className="hero-lead">Preskong gulay, isda, karne, at iba pa — handpicked by your trusted market shopper and delivered to your door.</p>
              <form className="search-box" onSubmit={handleSearch}>
                <Icon name="search" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ano ang hanap mo today?" aria-label="Search groceries" />
                <Button type="submit" className="primary">Search</Button>
              </form>
              <div className="quick-links"><span>Popular:</span><button onClick={() => setSearch("Tilapia")}>Fresh tilapia</button><button onClick={() => setSearch("Mangoes")}>Mangoes</button><button onClick={() => setActiveCategory("Gulay")}>Gulay</button></div>
              <div className="hero-actions">
                <a className="link-arrow" href="/shop" onClick={(event) => { event.preventDefault(); navigate("/shop"); }}>Browse groceries <Icon name="arrow" size={18} /></a>
                <a className="paluto-link" href="/paluto" onClick={(event) => { event.preventDefault(); navigate("/paluto"); }}><Icon name="sparkle" size={18} /> Try Paluto</a>
              </div>
            </div>
            <div className="hero-visual" aria-label="Fresh produce from local market vendors">
              <div className="photo photo-main"><img src={photos.market} alt="Market vendor packing fresh vegetables" /></div>
              <div className="photo photo-top"><img src={photos.fish} alt="Fresh fish at the market" /></div>
              <div className="photo photo-bottom"><img src={photos.fruit} alt="Colorful fresh fruit" /></div>
              <div className="floating-card"><span><Icon name="check" size={16} /></span><div><strong>Personal shopper</strong><small>Quality checked for you</small></div></div>
              <div className="fresh-stamp"><Icon name="leaf" /><strong>Fresh<br />today</strong></div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="shell trust-grid">
            <div><Icon name="shield" /><span><strong>Suki-approved quality</strong><small>Pinipili na parang ikaw</small></span></div>
            <div><Icon name="clock" /><span><strong>As fast as 90 minutes</strong><small>From market to doorstep</small></span></div>
            <div><Icon name="truck" /><span><strong>Careful delivery</strong><small>Freshness protected</small></span></div>
            <div className="rating"><strong>4.9</strong><span><span className="stars">★★★★★</span><small>from 2,400+ suki</small></span></div>
          </div>
        </section>

        <section className="section shell" id="shop">
          <div className="section-heading">
            <div><p className="kicker">Start your market run</p><h2>Shop by category</h2></div>
            <a href="/shop" onClick={(event) => { event.preventDefault(); navigate("/shop"); }}>View all <Icon name="arrow" size={18} /></a>
          </div>
          <div className="categories">
            {categories.map((category) => (
              <button key={category.name} onClick={() => setActiveCategory(category.name === activeCategory ? "All" : category.name)} className={activeCategory === category.name ? "active" : ""}>
                <span><Icon name={category.icon} /></span><strong>{category.name}</strong><small>{category.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="shell market-banner">
          <div>
            <p className="kicker">Your market run, made easy</p>
            <h2>Real palengke freshness,<br />without the long lines.</h2>
            <p>We shop directly from trusted stalls at Cubao Farmers Market.</p>
            <a href="/shop" onClick={(event) => { event.preventDefault(); navigate("/shop"); }}>Shop Farmers Market <Icon name="arrow" size={18} /></a>
          </div>
          <div className="market-photo"><img src={photos.palengke} alt="Busy local fresh market" /></div>
          <span className="banner-pattern"></span>
        </section>

        <section className="section shell" id="products">
          <div className="section-heading products-heading">
            <div><p className="kicker">Picked fresh this morning</p><h2>Featured products</h2></div>
            <div className="filter-pills">
              {["All", "Gulay", "Isda", "Prutas"].map((item) => <button key={item} className={activeCategory === item ? "active" : ""} onClick={() => setActiveCategory(item)}>{item}</button>)}
            </div>
          </div>
          {filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div> :
            <div className="empty"><Icon name="bag" size={32} /><h3>Walang nahanap</h3><p>Try another search or category.</p><Button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="primary">See all products</Button></div>}
        </section>

        <section className="deal-wrap">
          <div className="shell deal">
            <div className="deal-copy">
              <span className="deal-tag"><Icon name="sparkle" size={15} /> TODAY'S BEST DEAL</span>
              <p className="kicker">Suki savings</p>
              <h2>Fresh Sinigang Bundle</h2>
              <p>Everything you need for a comforting family pot — kangkong, labanos, sitaw, kamatis, and your choice of protein.</p>
              <div className="deal-price"><strong>₱349</strong><del>₱425</del><span>Save ₱76</span></div>
              <Button className="dark" onClick={() => addToCart("Sinigang Bundle")}>Add bundle to cart <Icon name="arrow" size={18} /></Button>
            </div>
            <div className="deal-image"><img src={photos.vendor} alt="Fresh vegetables selected at the market" /><span>18%<small>OFF</small></span></div>
          </div>
        </section>

        <section className="section shell split-cards" id="paluto">
          <article className="split-card paluto-card">
            <div><span className="mini-icon"><Icon name="sparkle" /></span><p className="kicker">Paluto</p><h2>Pick it fresh.<br />We cook it for you.</h2><p>Choose a trusted market stall and your favorite Filipino dish. Kami na bahala sa ingredients at luto.</p><a href="/paluto" onClick={(event) => { event.preventDefault(); navigate("/paluto"); }}>Explore Paluto <Icon name="arrow" size={18} /></a></div>
            <img src={photos.fish} alt="Fresh seafood ready for Paluto" />
          </article>
          <article className="split-card recipe-card">
            <div><span className="mini-icon"><Icon name="leaf" /></span><p className="kicker">Cook it yourself</p><h2>Recipe-ready<br />ingredients.</h2><p>From adobo to sinigang, add every ingredient to your cart in one easy tap.</p><a href="/recipes" onClick={(event) => { event.preventDefault(); navigate("/recipes"); }}>Browse recipes <Icon name="arrow" size={18} /></a></div>
            <img src={photos.carrots} alt="Fresh recipe ingredients" />
          </article>
        </section>

        <section className="how" id="how">
          <div className="shell">
            <div className="center-heading"><p className="kicker">Simple. Fresh. Maaasahan.</p><h2>How Palengkey works</h2><p>Your palengke run in three easy steps.</p></div>
            <div className="steps">
              <article><span className="step-number">01</span><div className="step-icon"><Icon name="search" size={27} /></div><h3>Browse & order</h3><p>Shop fresh market goods, choose your preferred weight, and tell us exactly how you like it.</p></article>
              <span className="step-line"></span>
              <article><span className="step-number">02</span><div className="step-icon"><Icon name="bag" size={27} /></div><h3>We shop for you</h3><p>Your personal shopper handpicks every item from trusted market suki stalls.</p></article>
              <span className="step-line"></span>
              <article><span className="step-number">03</span><div className="step-icon"><Icon name="truck" size={27} /></div><h3>Fresh delivery</h3><p>Your order arrives carefully packed, fresh, and ready for your kitchen.</p></article>
            </div>
          </div>
        </section>

        <section className="section shell">
          <div className="section-heading"><div><p className="kicker">Loved by our mga suki</p><h2>Fresh stories from the community</h2></div><div className="suki-level"><Icon name="star" /><span><strong>4.9 Suki Trust Level</strong><small>2,400+ verified orders</small></span></div></div>
          <div className="testimonials">
            {[
              ["“Parang ako mismo ang namili.”", "Super fresh ang gulay and they followed my notes for the fish. Sobrang convenient!", "Mara G.", "Quezon City"],
              ["“Sunday palengke, minus the traffic.”", "The shopper even sent a photo before buying. That kind of care makes me keep coming back.", "Paolo R.", "Mandaluyong"],
              ["“Paluto is a game changer.”", "Fresh seafood delivered already cooked for our family lunch. Sulit and delicious!", "Tita Liza", "San Juan"],
            ].map(([title, quote, name, place]) => <article key={name}><div className="stars">★★★★★</div><h3>{title}</h3><p>{quote}</p><div className="person"><span>{name.charAt(0)}</span><div><strong>{name}</strong><small>Verified suki · {place}</small></div></div></article>)}
          </div>
        </section>
      </main>

      <Footer onNavigate={navigate} />
      <button className="chat" onClick={() => navigate("/support/chat")} aria-label="Chat with support"><span></span><Icon name="message" /></button>
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </div>
  );
}

export default App;
