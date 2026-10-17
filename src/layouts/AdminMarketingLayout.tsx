import { NavLink, Outlet } from "react-router-dom";
import { ManageHeader } from "@/components/admin/AdminManageList";

const tabs = [
  { to: "/admin/marketing/hero-content", label: "Homepage hero" },
  { to: "/admin/marketing/highlights", label: "Highlights" },
  { to: "/admin/marketing/popup-ads", label: "Popup ads" },
  { to: "/admin/marketing/vouchers", label: "Vouchers" },
  { to: "/admin/marketing/sms", label: "SMS blast" },
  { to: "/admin/marketing/email", label: "Email blast" },
  { to: "/admin/marketing/push", label: "Push blast" },
];

export default function AdminMarketingLayout() {
  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Content management"
        title="Storefront content"
        description="Update customer-facing campaigns without a deployment."
      />

      <nav
        aria-label="Content sections"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary-700"
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
