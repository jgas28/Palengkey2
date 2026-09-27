import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import NotificationBell from "@/features/notifications/NotificationBell";
import { useCart } from "@/features/cart/useCart";
import { useAuthStore } from "@/stores/authStore";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Paluto", to: "/paluto" },
  { label: "About", to: "/about" },
  { label: "Careers", to: "/careers" },
];

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center">
      <img src="/assets/name.png" alt="Palengkey" className="h-9 w-auto" />
    </Link>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: cart } = useCart();
  const cartCount = cart?.items.reduce((sum, item) => sum + item.item_quantity, 0) ?? 0;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Always solid — a transparent-over-hero header looked broken while
  // scrolling, so every page (including the marketing landing page) gets
  // the same solid bar.
  const navBg = "border-b border-[#DDE9EA] bg-white/95 shadow-sm backdrop-blur-md";
  const linkTone = "text-[#66777C] hover:text-[#0097A7]";
  const activeLinkTone = "text-[#0097A7] font-semibold";
  const iconTone = "text-[#66777C]";
  const iconHover = "hover:bg-[#E8F7F7]";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${navBg}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm transition-colors focus-visible:outline-none ${isActive ? activeLinkTone : linkTone}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            to="/shop"
            aria-label="Search"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconHover}`}
          >
            <Search size={18} className={iconTone} aria-hidden="true" />
          </Link>
          <NotificationBell variant="light" />
          <Link
            to="/cart"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconHover}`}
          >
            <ShoppingCart size={18} className={iconTone} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <Link
              to="/profile"
              aria-label="Profile"
              className={`ml-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconHover}`}
            >
              <User size={18} className={iconTone} aria-hidden="true" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-1 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-95"
            >
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-text transition-colors hover:bg-primary-50 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div className="space-y-1 border-t border-border bg-surface px-6 py-5 shadow-lifted md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block py-2.5 text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-text hover:text-primary"}`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="flex gap-3 border-t border-border pt-3">
            <Link
              to="/notifications"
              className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-text transition-colors hover:bg-background"
            >
              Notifications
            </Link>
            <Link
              to="/cart"
              className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-text transition-colors hover:bg-background"
            >
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="flex gap-3 pt-3">
              <Link
                to="/orders"
                className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-text transition-colors hover:bg-background"
              >
                Orders
              </Link>
              <Link
                to="/profile"
                className="flex-1 rounded-xl bg-primary-500 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Profile
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="mt-3 block rounded-xl bg-primary-500 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
