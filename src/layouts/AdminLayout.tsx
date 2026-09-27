import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { adminLogout } from "@/services/api/adminAuth";
import ToastContainer from "@/components/ui/ToastContainer";
import type { AdminRole } from "@/types/adminAuth";

interface NavItem {
  to: string;
  label: string;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    roles: ["admin", "owner", "super_admin"],
  },
  { to: "/admin/items", label: "Items", roles: ["admin", "super_admin"] },
  { to: "/admin/inventory", label: "Inventory & Pricing", roles: ["admin", "super_admin"] },
  { to: "/admin/recipes", label: "Recipes", roles: ["admin", "super_admin"] },
  { to: "/admin/recipe-types", label: "Recipe Types", roles: ["admin", "super_admin"] },
  { to: "/admin/paluto-stalls", label: "Paluto Stalls", roles: ["admin", "super_admin"] },
  { to: "/admin/orders", label: "Orders", roles: ["admin", "super_admin"] },
  { to: "/admin/riders", label: "Riders", roles: ["admin", "super_admin"] },
  {
    to: "/admin/riders/tracking",
    label: "Rider Tracking",
    roles: ["admin", "super_admin"],
  },
  { to: "/admin/feedback", label: "Suki Trust Level", roles: ["admin", "super_admin"] },
  { to: "/admin/support", label: "Support", roles: ["admin", "super_admin"] },
  { to: "/admin/marketing", label: "Marketing", roles: ["marketing", "super_admin"] },
  { to: "/admin/finance", label: "Finance", roles: ["finance", "super_admin"] },
  { to: "/admin/reports", label: "Reports", roles: ["owner", "super_admin"] },
  { to: "/admin/users", label: "Accounts", roles: ["super_admin"] },
  {
    to: "/admin/verifications",
    label: "Verifications",
    roles: ["super_admin"],
  },
  {
    to: "/admin/cod-submissions",
    label: "COD ID Review",
    roles: ["super_admin"],
  },
  { to: "/admin/categories", label: "Categories", roles: ["super_admin"] },
  { to: "/admin/markets", label: "Markets", roles: ["super_admin"] },
  { to: "/admin/types-units", label: "Types & Units", roles: ["super_admin"] },
  { to: "/admin/careers", label: "Careers", roles: ["super_admin"] },
  { to: "/admin/settings", label: "Settings", roles: ["super_admin"] },
  {
    to: "/admin/audit-logs",
    label: "Audit Logs",
    roles: ["admin", "marketing", "finance", "owner", "super_admin"],
  },
];

export default function AdminLayout() {
  const user = useAdminAuthStore((state) => state.user);
  const clearSession = useAdminAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

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

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-gradient-accent text-white shadow-soft"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
          ))}
        </nav>

        <main className="flex-1 bg-gradient-surface px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
