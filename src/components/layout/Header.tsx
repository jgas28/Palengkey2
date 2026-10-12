import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import AccountMenu from "@/components/layout/AccountMenu";
import { useCart } from "@/features/cart/useCart";
import { useUnreadCount } from "@/features/notifications/useUnreadCount";
import NotificationBell from "@/features/notifications/NotificationBell";
import { useAuthStore } from "@/stores/authStore";

const DESKTOP_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Paluto", to: "/paluto" },
  { label: "Recipes", to: "/recipes" },
  { label: "About", to: "/about" },
  { label: "Careers", to: "/careers" },
];

const MOBILE_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Cart", to: "/cart" },
  { label: "Paluto", to: "/paluto" },
  { label: "Recipes", to: "/recipes" },
  { label: "Profile", to: "/profile" },
  { label: "Orders", to: "/orders" },
  { label: "Notifications", to: "/notifications" },
  { label: "Support", to: "/support" },
  { label: "About", to: "/about" },
  { label: "Careers", to: "/careers" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? "logo-light" : ""}`}>
      <img src="/palengkey-logo.png" alt="PalengKey" />
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: cart } = useCart();
  const { data: unreadCount = 0 } = useUnreadCount();
  const cartCount =
    (cart?.items.reduce((sum, item) => sum + item.item_quantity, 0) ?? 0) +
    (cart?.recipe_bundles?.length ?? 0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="header" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="shell nav">
        <Link to="/" aria-label="Palengkey home">
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {DESKTOP_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              style={({ isActive }) => (isActive ? { color: "var(--teal)" } : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn hide-mobile"
            aria-label="Search"
            onClick={() => navigate("/shop")}
          >
            <Icon name="search" />
          </button>
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            className="icon-btn cart-button"
            onClick={() => navigate("/cart")}
            aria-label={`Cart with ${cartCount} items`}
          >
            <Icon name="cart" />
            {cartCount > 0 && (
              <span className="cart-count">{cartCount > 99 ? "99+" : cartCount}</span>
            )}
          </button>
          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <button
              type="button"
              className="btn login hide-mobile"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          )}
          <button
            type="button"
            className="icon-btn mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {MOBILE_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
              {link.to === "/cart" && cartCount > 0 ? ` (${cartCount})` : ""}
              {link.to === "/notifications" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
          ))}
          {!isAuthenticated && (
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
