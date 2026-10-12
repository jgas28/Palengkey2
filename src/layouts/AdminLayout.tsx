import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bike,
  BookOpen,
  Briefcase,
  ChefHat,
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Ruler,
  ScrollText,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Users,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { InitialsAvatar } from "@/components/admin/AdminUi";
import AdminOrderBell from "@/features/admin/AdminOrderBell";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { adminLogout } from "@/services/api/adminAuth";
import ToastContainer from "@/components/ui/ToastContainer";
import type { AdminRole } from "@/types/adminAuth";

interface NavItem {
  to: string;
  label: string;
  roles: AdminRole[];
}

interface NavGroup {
  /** Omitted for the top-level items that sit above every section. */
  label?: string;
  items: NavItem[];
}

const ADMIN: AdminRole[] = ["admin", "super_admin"];
const SUPER: AdminRole[] = ["super_admin"];

const navGroups: NavGroup[] = [
  {
    items: [
      {
        to: "/admin/dashboard",
        label: "Dashboard",
        roles: ["admin", "owner", "super_admin"],
      },
    ],
  },
  {
    label: "Orders & Delivery",
    items: [
      { to: "/admin/orders", label: "Orders", roles: ADMIN },
      { to: "/admin/riders", label: "Riders", roles: ADMIN },
      { to: "/admin/riders/tracking", label: "Rider Tracking", roles: ADMIN },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/items", label: "Items", roles: ADMIN },
      { to: "/admin/inventory", label: "Inventory & Pricing", roles: ADMIN },
      { to: "/admin/categories", label: "Categories", roles: SUPER },
      { to: "/admin/types-units", label: "Types & Units", roles: SUPER },
      { to: "/admin/markets", label: "Markets", roles: SUPER },
    ],
  },
  {
    label: "Paluto & Recipes",
    items: [
      { to: "/admin/paluto-stalls", label: "Paluto Stalls", roles: ADMIN },
      { to: "/admin/recipes", label: "Recipes", roles: ADMIN },
      { to: "/admin/recipe-types", label: "Recipe Types", roles: ADMIN },
    ],
  },
  {
    label: "Customers",
    items: [
      { to: "/admin/support", label: "Support", roles: ADMIN },
      { to: "/admin/feedback", label: "Suki Trust Level", roles: ADMIN },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/admin/marketing", label: "Marketing", roles: ["marketing", "super_admin"] },
      { to: "/admin/finance", label: "Finance", roles: ["finance", "super_admin"] },
      { to: "/admin/reports", label: "Reports", roles: ["owner", "super_admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/users", label: "Accounts", roles: SUPER },
      { to: "/admin/careers", label: "Careers", roles: SUPER },
      { to: "/admin/settings", label: "Settings", roles: SUPER },
      {
        to: "/admin/audit-logs",
        label: "Audit Logs",
        roles: ["admin", "marketing", "finance", "owner", "super_admin"],
      },
    ],
  },
];

/** Pages reached through a tab bar rather than the sidebar — still findable with "Jump to…". */
const MARKETING: AdminRole[] = ["marketing", "super_admin"];
const searchOnlyItems: (NavItem & { group: string })[] = [
  {
    to: "/admin/marketing/vouchers",
    label: "Vouchers",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/popup-ads",
    label: "Popup Ads",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/hero-content",
    label: "Hero Content (banners)",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/highlights",
    label: "Highlights",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/sms",
    label: "SMS Blast",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/email",
    label: "Email Blast",
    roles: MARKETING,
    group: "Marketing",
  },
  {
    to: "/admin/marketing/push",
    label: "Push Blast",
    roles: MARKETING,
    group: "Marketing",
  },
  { to: "/admin/items/new", label: "Add item", roles: ADMIN, group: "Catalog" },
  {
    to: "/admin/recipes/new",
    label: "Add recipe",
    roles: ADMIN,
    group: "Paluto & Recipes",
  },
];

/** Sidebar icon per page. */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/orders": ShoppingCart,
  "/admin/riders": Bike,
  "/admin/riders/tracking": MapPin,
  "/admin/items": Package,
  "/admin/inventory": Warehouse,
  "/admin/categories": Tags,
  "/admin/types-units": Ruler,
  "/admin/markets": Store,
  "/admin/paluto-stalls": ChefHat,
  "/admin/recipes": BookOpen,
  "/admin/recipe-types": ListTree,
  "/admin/support": LifeBuoy,
  "/admin/feedback": Star,
  "/admin/marketing": Megaphone,
  "/admin/finance": Wallet,
  "/admin/reports": BarChart3,
  "/admin/users": Users,
  "/admin/careers": Briefcase,
  "/admin/settings": Settings,
  "/admin/audit-logs": ScrollText,
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Market admin",
  owner: "Owner",
  marketing: "Marketing",
  finance: "Finance",
};

const allPaths = navGroups.flatMap((group) => group.items.map((item) => item.to));

/** Exact-match items that prefix another item (Riders vs Rider Tracking), so only one is active. */
function needsExactMatch(path: string): boolean {
  return allPaths.some((other) => other !== path && other.startsWith(`${path}/`));
}

function isItemActive(path: string, pathname: string): boolean {
  return needsExactMatch(path)
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`);
}

export default function AdminLayout() {
  const user = useAdminAuthStore((state) => state.user);
  const clearSession = useAdminAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();
  // Explicit open/closed choices; a section with no entry is open only while it holds the
  // current page, so navigating keeps the active section expanded without manual clicks.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // "Jump to…" — filters every page the role can open; Ctrl/⌘+K focuses it from anywhere.
  const [jump, setJump] = useState("");
  const jumpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        jumpRef.current?.focus();
        jumpRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const canSeeOrders = user ? ADMIN.includes(user.role) : false;

  // Clear the search, close menus after navigating somewhere.
  useEffect(() => {
    setJump("");
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userMenuOpen]);

  if (!user) return null;

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  // Roles with only a handful of pages (marketing, finance, owner) get a flat list.
  const isGrouped = visibleGroups.reduce((sum, group) => sum + group.items.length, 0) > 6;

  const jumpTerm = jump.trim().toLowerCase();
  const jumpResults = jumpTerm
    ? visibleGroups
        .flatMap((group) =>
          group.items
            .filter((item) =>
              `${item.label} ${group.label ?? ""}`.toLowerCase().includes(jumpTerm),
            )
            .map((item) => ({ ...item, group: group.label })),
        )
        .concat(
          searchOnlyItems.filter(
            (item) =>
              item.roles.includes(user.role) &&
              `${item.label} ${item.group}`.toLowerCase().includes(jumpTerm),
          ),
        )
    : [];

  function handleJumpKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && jumpResults[0]) {
      navigate(jumpResults[0].to);
      jumpRef.current?.blur();
    }
    if (event.key === "Escape") {
      setJump("");
      jumpRef.current?.blur();
    }
  }

  const pageTitle =
    [...navGroups.flatMap((group) => group.items), ...searchOnlyItems]
      .filter(
        (item) =>
          location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      )
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? "Admin";

  function isGroupOpen(group: NavGroup): boolean {
    if (!group.label) return true;
    return (
      openGroups[group.label] ??
      group.items.some((item) => isItemActive(item.to, location.pathname))
    );
  }

  function toggleGroup(group: NavGroup) {
    if (!group.label) return;
    const label = group.label;
    setOpenGroups((prev) => ({ ...prev, [label]: !isGroupOpen(group) }));
  }

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // Best-effort — clear the local session regardless.
    } finally {
      await clearSession();
      navigate("/admin/login", { replace: true });
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pb-4 pt-5">
        <img src="/palengkey-logo.png" alt="PalengKey" className="h-9 w-auto" />
        <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
          Admin
        </span>
      </div>

      <div className="px-4 pb-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 focus-within:border-primary-300 focus-within:bg-white">
          <Search size={15} aria-hidden="true" className="shrink-0" />
          <input
            ref={jumpRef}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={handleJumpKey}
            placeholder="Jump to…"
            aria-label="Jump to an admin page"
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1 text-[10px] text-slate-400 lg:inline">
            Ctrl K
          </kbd>
        </label>
      </div>

      <nav
        aria-label="Admin"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3"
      >
        {jumpTerm && (
          <div className="flex flex-col gap-0.5">
            {jumpResults.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">
                No page matches “{jump}”.
              </p>
            )}
            {jumpResults.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col rounded-lg px-3 py-2 text-sm font-medium ${
                  index === 0
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
                {item.group && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    {item.group}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
        {!jumpTerm &&
          visibleGroups.map((group) => {
            const showHeader = isGrouped && group.label;
            const open = !showHeader || isGroupOpen(group);
            const groupId = `admin-nav-${group.label ?? "main"}`.replace(/\W+/g, "-");
            return (
              <div key={group.label ?? "main"} className="flex flex-col gap-0.5">
                {showHeader && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={open}
                    aria-controls={groupId}
                    className="mt-3 flex items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
                  >
                    {group.label}
                    <ChevronDown
                      size={13}
                      aria-hidden="true"
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
                {open && (
                  <div id={groupId} className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const ItemIcon = NAV_ICONS[item.to] ?? LayoutDashboard;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={needsExactMatch(item.to)}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-primary-50 text-primary-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <ItemIcon
                                size={17}
                                aria-hidden="true"
                                className={
                                  isActive
                                    ? "text-primary-700"
                                    : "text-slate-400 group-hover:text-slate-600"
                                }
                              />
                              {item.label}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        {sidebar}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">
                {pageTitle}
              </h1>
              {location.pathname === "/admin/dashboard" && (
                <p className="hidden text-xs text-slate-500 sm:block">
                  Welcome back — here’s what’s happening today.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSeeOrders && <AdminOrderBell />}

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
              >
                <InitialsAvatar name={user.name} size={32} />
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-slate-900">
                    {user.name}
                  </span>
                  <span className="block text-xs leading-tight text-slate-500">
                    {ROLE_LABELS[user.role] ?? user.role}
                    {user.market_name ? ` · ${user.market_name}` : ""}
                  </span>
                </span>
                <ChevronDown size={15} className="text-slate-400" aria-hidden="true" />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
