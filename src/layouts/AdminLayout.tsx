import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
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
      { to: "/admin/verifications", label: "Verifications", roles: SUPER },
      { to: "/admin/cod-submissions", label: "COD ID Review", roles: SUPER },
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

  if (!user) return null;

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  // Roles with only a handful of pages (marketing, finance, owner) get a flat list.
  const isGrouped = visibleGroups.reduce((sum, group) => sum + group.items.length, 0) > 6;

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

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-56 shrink-0 flex-col bg-gradient-brand px-4 py-6 shadow-lifted md:flex">
        <p className="mb-1 text-lg font-semibold text-white">Palengkey</p>
        <p className="mb-8 text-xs text-white/70">Admin Panel</p>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {visibleGroups.map((group) => {
            const showHeader = isGrouped && group.label;
            const open = !showHeader || isGroupOpen(group);
            const groupId = `admin-nav-${group.label ?? "main"}`.replace(/\W+/g, "-");
            return (
              <div key={group.label ?? "main"} className="flex flex-col gap-1">
                {showHeader && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={open}
                    aria-controls={groupId}
                    className="mt-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-white"
                  >
                    {group.label}
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
                {open && (
                  <div id={groupId} className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={needsExactMatch(item.to)}
                        className={({ isActive }) =>
                          `rounded-lg py-2 text-sm font-medium ${showHeader ? "pl-5 pr-3" : "px-3"} ${
                            isActive
                              ? "bg-gradient-accent text-white shadow-soft"
                              : "text-white/75 hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/20 pt-4 text-xs text-white/70">
          <p className="mb-1 font-medium text-white">{user.name}</p>
          <p className="mb-1 capitalize">{user.role.replace("_", " ")}</p>
          {user.market_name && <p className="mb-3">{user.market_name}</p>}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="font-medium text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-gradient-brand px-4 py-3 shadow-soft md:hidden">
          <span className="text-lg font-semibold text-white">Palengkey Admin</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-sm font-medium text-white"
          >
            Log out
          </button>
        </header>

        <nav
          aria-label="Admin"
          className="flex gap-1 overflow-x-auto border-b border-border bg-gradient-surface px-4 py-2 md:hidden"
        >
          {visibleGroups.flatMap((group, index) => [
            index > 0 && (
              <span
                key={`divider-${group.label}`}
                aria-hidden="true"
                className="my-1.5 w-px shrink-0 bg-border"
              />
            ),
            ...group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={needsExactMatch(item.to)}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-pill px-3 py-1.5 text-sm font-medium ${
                    isActive
                      ? "bg-gradient-brand text-white shadow-soft"
                      : "text-text-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            )),
          ])}
        </nav>

        <main className="flex-1 bg-gradient-surface px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
