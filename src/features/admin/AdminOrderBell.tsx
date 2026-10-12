import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Inbox } from "lucide-react";
import { InitialsAvatar } from "@/components/admin/AdminUi";
import { listAdminOrders } from "@/services/api/adminOrders";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

/**
 * Header bell for market admins: orders waiting to be confirmed. Opens a list
 * (newest first); each one opens that order. Refreshes every minute.
 */
export default function AdminOrderBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { data } = useQuery({
    queryKey: ["adminNewOrders"],
    queryFn: () => listAdminOrders({ status: "order_received", page: 1 }),
    refetchInterval: 60_000,
  });

  const count = data?.counts.order_received ?? 0;
  const orders = data?.orders.data ?? [];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !ref.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count > 0 ? `${count} new orders` : "No new orders"}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ef3b18] px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="New orders"
          className="absolute right-0 top-full z-40 mt-2 w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">New orders</p>
            {count > 0 && (
              <span className="rounded-full bg-[#ef3b18]/10 px-2 py-0.5 text-xs font-semibold text-[#ef3b18]">
                {count} waiting
              </span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-50 text-primary-700">
                  <Inbox size={18} />
                </span>
                <p className="text-sm font-medium text-slate-700">You’re all caught up</p>
                <p className="text-xs text-slate-500">
                  New orders waiting for confirmation show up here.
                </p>
              </div>
            ) : (
              orders.slice(0, 8).map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                >
                  <InitialsAvatar name={order.contact_name} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      #{order.order_number}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {order.contact_name} · ₱
                      {Number(order.total_amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                      {order.is_reservation ? " · order later" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {timeAgo(order.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>

          <Link
            to="/admin/orders?status=order_received"
            className="flex items-center justify-center gap-1 border-t border-slate-100 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50/50"
          >
            View all new orders <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
