import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/** Semantic colour per order/payment state — one place so every admin table agrees. */
const STATUS_TONES: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  order_received: { label: "New", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  order_confirmed: {
    label: "Confirmed",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  preparing_items: {
    label: "Preparing",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  out_for_delivery: {
    label: "Out for delivery",
    className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  refunded: {
    label: "Refunded",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tone.className}`}
    >
      {tone.label}
    </span>
  );
}

/** White surface card used across the redesigned admin. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

/** Initials avatar with a stable brand-ish colour per name. */
export function InitialsAvatar({
  name,
  size = 32,
}: {
  name: string | null | undefined;
  size?: number;
}) {
  const text = (name ?? "?").trim();
  const initials =
    text
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  const palette = ["#0097A7", "#0A9137", "#00737E", "#2F855A", "#0E7490", "#B45309"];
  const color =
    palette[[...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];

  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

/** "No orders yet"-style empty state. */
export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-700">
        <Inbox size={20} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="max-w-xs text-xs text-slate-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Grey shimmer bars while data loads. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-200" />
            <span className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-100" />
          </span>
        </div>
      ))}
    </div>
  );
}
