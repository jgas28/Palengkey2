import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  CreditCard,
  Tag,
  Bell,
  ShieldCheck,
  HelpCircle,
  Info,
  Briefcase,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react";
import AvatarUpload from "@/features/profile/AvatarUpload";
import {
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
} from "@/services/api/auth";
import { getOrderStats, listOrders } from "@/services/api/orders";
import { listAddresses } from "@/services/api/addresses";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import { normalizeOrderStatus, ORDER_STATUS_LABELS } from "@/features/orders/orderStatus";

const STATUS_COLOR: Record<string, string> = {
  delivered: "text-[#159447] bg-green-50",
  cancelled: "text-[#F05A47] bg-red-50",
};

type MenuItem = { icon: ReactNode; label: string; desc: string; to: string };

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState<"one" | "all" | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "orders">("overview");

  const { data: stats } = useQuery({
    queryKey: ["orderStats"],
    queryFn: getOrderStats,
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });

  const { data: recentOrdersPage } = useQuery({
    queryKey: ["orders", 1],
    queryFn: () => listOrders(1),
    enabled: activeTab === "orders",
  });

  async function handleLogout(scope: "one" | "all") {
    setLoggingOut(scope);
    try {
      await (scope === "all" ? logoutAllRequest() : logoutRequest());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Logout failed.", "info");
    } finally {
      await clearSession();
      navigate("/login", { replace: true });
      setLoggingOut(null);
    }
  }

  if (!user) return null;

  const defaultAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0];

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Shopping",
      items: [
        { icon: <Package className="h-5 w-5" />, label: "My Orders", desc: "Track and review past orders", to: "/orders" },
        { icon: <MapPin className="h-5 w-5" />, label: "Delivery Addresses", desc: "Manage saved addresses", to: "/addresses" },
      ],
    },
    {
      title: "Payment",
      items: [
        { icon: <Tag className="h-5 w-5" />, label: "Vouchers & Promos", desc: "Your available coupons", to: "/vouchers" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: <Bell className="h-5 w-5" />, label: "Notifications", desc: "Order updates and promos", to: "/notifications" },
        { icon: <ShieldCheck className="h-5 w-5" />, label: "Change Password", desc: "Update your login password", to: "/profile/password" },
        { icon: <HelpCircle className="h-5 w-5" />, label: "Help & Support", desc: "Chat or browse FAQs", to: "/support" },
        { icon: <Info className="h-5 w-5" />, label: "About Palengkey", desc: "Our story and mission", to: "/about" },
        { icon: <Briefcase className="h-5 w-5" />, label: "Careers", desc: "Join our growing team", to: "/careers" },
      ],
    },
  ];

  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-10 md:-mx-6">
      {/* Profile hero */}
      <div className="relative overflow-hidden bg-[#203238]">
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              <AvatarUpload imageUrl={user.profile_image} />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-xs text-white/60">Welcome back</p>
              <h1 className="truncate font-display text-2xl font-bold leading-tight text-white">
                {user.fname} {user.lname}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {(user.email_verified_at || user.phone_verified_at) && (
                  <span className="rounded-full bg-[#0097A7]/30 px-2 py-0.5 text-[10px] font-semibold text-[#5BC0BE]">
                    Verified Customer
                  </span>
                )}
                {user.phone && <span className="text-xs text-white/40">{user.phone}</span>}
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="ml-auto shrink-0 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-2xl px-4 sm:px-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex justify-center">
              <Package className="h-5 w-5 text-[#0097A7]" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold leading-tight text-[#203238]">
              {stats?.total_orders ?? "—"}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-[#66777C]">Total Orders</p>
          </div>
          <div className="rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex justify-center">
              <CreditCard className="h-5 w-5 text-[#0097A7]" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold leading-tight text-[#203238]">
              {stats ? formatPeso(stats.total_spent) : "—"}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-[#66777C]">Total Spent</p>
          </div>
          <div className="rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex justify-center">
              <MapPin className="h-5 w-5 text-[#0097A7]" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold leading-tight text-[#203238]">
              {addresses?.length ?? "—"}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-[#66777C]">Addresses</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white shadow-sm">
          <div className="flex border-b border-[#DDE9EA]">
            {(
              [
                ["overview", "Overview"],
                ["orders", "Recent Orders"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? "border-b-2 border-[#0097A7] text-[#0097A7]"
                    : "text-[#66777C] hover:text-[#203238]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-xl bg-[#F7FAFA] p-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0097A7]" aria-hidden="true" />
                <div className="flex-1">
                  <p className="mb-0.5 text-xs text-[#66777C]">Default Address</p>
                  <p className="text-sm font-medium text-[#203238]">
                    {defaultAddress ? defaultAddress.address : "No saved address yet"}
                  </p>
                </div>
                <Link
                  to="/addresses"
                  className="shrink-0 text-xs font-semibold text-[#0097A7]"
                >
                  {defaultAddress ? "Change" : "Add"}
                </Link>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="divide-y divide-[#DDE9EA]">
              {!recentOrdersPage && (
                <p className="p-5 text-center text-sm text-[#66777C]">Loading…</p>
              )}
              {recentOrdersPage && recentOrdersPage.data.length === 0 && (
                <p className="p-5 text-center text-sm text-[#66777C]">No orders yet.</p>
              )}
              {recentOrdersPage?.data.slice(0, 3).map((order) => {
                const status = normalizeOrderStatus(order.status);
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-[#F7FAFA]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F7]">
                      <Package className="h-5 w-5 text-[#0097A7]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#203238]">
                          {order.order_number}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_COLOR[status] ?? "bg-[#F7FAFA] text-[#66777C]"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#66777C]">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#203238]">
                        {formatPeso(Number(order.total_amount))}
                      </p>
                    </div>
                  </Link>
                );
              })}
              <div className="p-4 text-center">
                <Link
                  to="/orders"
                  className="text-sm font-semibold text-[#0097A7] hover:underline"
                >
                  View all orders →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <div
            key={section.title}
            className="mb-4 overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white shadow-sm"
          >
            <p className="px-5 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-[#66777C]">
              {section.title}
            </p>
            <div className="divide-y divide-[#DDE9EA]">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#F7FAFA]"
                >
                  <span className="w-7 shrink-0 text-[#66777C]">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#203238]">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[#66777C]">{item.desc}</p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[#DDE9EA] transition-colors group-hover:text-[#66777C]"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <Link
          to="/profile/delete-account"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-[#F05A47]/20 bg-white px-5 py-3.5 text-sm font-medium text-[#F05A47] shadow-sm transition-colors hover:bg-[#F05A47]/5"
        >
          <Trash2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">Delete account</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>

        <div className="mb-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={loggingOut !== null}
            onClick={() => void handleLogout("one")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F05A47]/30 py-3.5 text-sm font-semibold text-[#F05A47] transition-all hover:bg-[#F05A47] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut === "one" ? "Signing out…" : "Sign Out"}
          </button>
          <button
            type="button"
            disabled={loggingOut !== null}
            onClick={() => void handleLogout("all")}
            className="w-full rounded-2xl py-2 text-xs font-medium text-[#66777C] transition-colors hover:text-[#203238] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut === "all" ? "Signing out…" : "Sign out of all devices"}
          </button>
        </div>

        <p className="mb-4 text-center text-xs text-[#66777C]">
          <Link to="/terms-of-service" className="hover:text-[#0097A7]">
            Terms
          </Link>{" "}
          ·{" "}
          <Link to="/privacy-policy" className="hover:text-[#0097A7]">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
