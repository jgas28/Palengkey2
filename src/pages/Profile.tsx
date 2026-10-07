import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "@/components/pk/Icon";
import AvatarUpload from "@/features/profile/AvatarUpload";
import { logout as logoutRequest, logoutAll as logoutAllRequest } from "@/services/api/auth";
import { getOrderStats, listOrders } from "@/services/api/orders";
import { listAddresses } from "@/services/api/addresses";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import {
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
  statusClass,
  statusStyle,
} from "@/features/orders/orderStatus";

const MENU: { label: string; description: string; to: string; icon: IconName }[] = [
  { label: "My orders", description: "Track active and past deliveries", to: "/orders", icon: "bag" },
  { label: "Saved addresses", description: "Manage your delivery locations", to: "/addresses", icon: "truck" },
  { label: "Vouchers", description: "Available promos and rewards", to: "/vouchers", icon: "sparkle" },
  { label: "Notifications", description: "Order and offer updates", to: "/notifications", icon: "bell" },
  { label: "Change password", description: "Update your login password", to: "/profile/password", icon: "shield" },
  { label: "Help & support", description: "FAQs and chat with our team", to: "/support", icon: "message" },
];

/** The design's profile page — dark hero, stat cards, recent order and account settings. */
export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState<"one" | "all" | null>(null);

  const { data: stats } = useQuery({ queryKey: ["orderStats"], queryFn: getOrderStats });
  const { data: addresses } = useQuery({ queryKey: ["addresses"], queryFn: listAddresses });
  const { data: recentOrdersPage } = useQuery({ queryKey: ["orders", 1], queryFn: () => listOrders(1) });
  const recentOrder = recentOrdersPage?.data[0];

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

  const verified = Boolean(user.email_verified_at || user.phone_verified_at);

  return (
    <main className="inner-page account-bg">
      <section className="profile-hero">
        <div className="shell profile-head">
          <span style={{ overflow: "hidden" }}>
            <AvatarUpload imageUrl={user.profile_image} />
          </span>
          <div>
            <small>{verified ? "Verified suki" : "Palengkey suki"}</small>
            <h1>
              {user.fname} {user.lname}
            </h1>
            <p>
              {[user.phone, user.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" className="btn outline" onClick={() => navigate("/profile/edit")}>
            Edit profile
          </button>
        </div>
      </section>

      <div className="shell profile-stats">
        <article>
          <small>Total orders</small>
          <strong>{stats?.total_orders ?? "—"}</strong>
        </article>
        <article>
          <small>Total spent</small>
          <strong>{stats ? formatPeso(stats.total_spent) : "—"}</strong>
        </article>
        <article>
          <small>Saved addresses</small>
          <strong>{addresses?.length ?? "—"}</strong>
        </article>
      </div>

      <div className="shell profile-layout">
        <section>
          <div className="profile-section-title">
            <h2>Recent order</h2>
            <button type="button" onClick={() => navigate("/orders")}>
              View all
            </button>
          </div>
          {recentOrder ? (
            <article
              className="recent-order"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/orders/${recentOrder.id}`)}
            >
              <div>
                <span className={`status ${statusClass(recentOrder.status)}`} style={statusStyle(recentOrder.status)}>
                  {ORDER_STATUS_LABELS[normalizeOrderStatus(recentOrder.status)]}
                </span>
                <h3>{recentOrder.order_number}</h3>
                <p>
                  {recentOrder.items.length} items ·{" "}
                  {new Date(recentOrder.received_at ?? recentOrder.created_at).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <strong>{formatPeso(Number(recentOrder.total_amount))}</strong>
            </article>
          ) : (
            <div className="recent-order">
              <div>
                <h3>No orders yet</h3>
                <p>Your first market run will show up here.</p>
              </div>
              <button type="button" className="btn primary" onClick={() => navigate("/shop")}>
                Shop now
              </button>
            </div>
          )}
        </section>

        <section className="settings">
          <h2>Account settings</h2>
          {MENU.map((item) => (
            <button type="button" key={item.to} onClick={() => navigate(item.to)}>
              <span>
                <Icon name={item.icon} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </div>
              <Icon name="chevron" />
            </button>
          ))}
          <button type="button" className="signout" disabled={loggingOut !== null} onClick={() => void handleLogout("one")}>
            {loggingOut === "one" ? "Signing out…" : "Sign out of this device"}
          </button>
          <button
            type="button"
            className="signout"
            style={{ marginTop: 0, color: "var(--muted)" }}
            disabled={loggingOut !== null}
            onClick={() => void handleLogout("all")}
          >
            {loggingOut === "all" ? "Signing out…" : "Sign out of all devices"}
          </button>
          <button
            type="button"
            className="signout"
            style={{ marginTop: 0, fontSize: 10 }}
            onClick={() => navigate("/profile/delete-account")}
          >
            Delete my account
          </button>
        </section>
      </div>
    </main>
  );
}
