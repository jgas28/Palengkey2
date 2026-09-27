import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/admin/marketing/vouchers", label: "Vouchers" },
  { to: "/admin/marketing/popup-ads", label: "Popup Ads" },
  { to: "/admin/marketing/hero-content", label: "Hero Content" },
  { to: "/admin/marketing/highlights", label: "Highlights" },
  { to: "/admin/marketing/sms", label: "SMS Blast" },
  { to: "/admin/marketing/email", label: "Email Blast" },
  { to: "/admin/marketing/push", label: "Push Blast" },
];

export default function AdminMarketingLayout() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Marketing</h1>

      <nav
        aria-label="Marketing"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
