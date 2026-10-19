import { Children, type ReactNode } from "react";
import usePagedRows from "@/hooks/usePagedRows";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";

/** "Management" page header: eyebrow, serif title, description and actions. */
export function ManageHeader({
  eyebrow = "Management",
  title,
  description,
  actionLabel = "Add new",
  onAction,
  extra,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex gap-2">
        {extra}
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus size={16} aria-hidden="true" /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Search box + optional filters, laid out like the Items toolbar. */
export function ManageToolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[220px] flex-1">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-600"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </label>
      {children}
    </div>
  );
}

export const manageSelect =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100";

type PillTone = "active" | "warning" | "muted" | "info";

const PILL_TONES: Record<PillTone, string> = {
  active: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  muted: "bg-slate-100 text-slate-500",
  info: "bg-primary-50 text-primary-700",
};

export function ManagePill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Icon tile, or the image when one is set. */
export function ManageIcon({ icon, image }: { icon: ReactNode; image?: string | null }) {
  return image ? (
    <img
      src={image}
      alt=""
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 object-cover"
    />
  ) : (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
      {icon}
    </span>
  );
}

/**
 * One row of a management list: clicking it opens the editor; `actions`
 * (deactivate/restore) sit before the pills and don't trigger the row.
 */
export function ManageRow({
  leading,
  title,
  subtitle,
  pills,
  actions,
  onOpen,
  dimmed,
}: {
  leading: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  pills?: ReactNode;
  actions?: ReactNode;
  onOpen: () => void;
  dimmed?: boolean;
}) {
  return (
    <li
      onClick={onOpen}
      className={`group flex cursor-pointer items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-slate-500">{subtitle}</span>
        )}
      </span>
      {actions && (
        <span
          className="hidden items-center gap-3 text-xs font-semibold sm:flex"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </span>
      )}
      <span className="flex items-center gap-2">{pills}</span>
      <button
        type="button"
        aria-label="Open"
        className="text-slate-400 group-hover:text-primary-700"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <ChevronRight size={18} />
      </button>
    </li>
  );
}

/** Card wrapper for the rows, with optional footer (pagination). */
export function ManageList({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-slate-100">{children}</ul>
      {footer}
    </Card>
  );
}

/**
 * Pagination bar shown under every admin list: "Showing 1–20 of 57" plus
 * Previous / page numbers / Next. Always visible once there are rows.
 */
export function PagerBar({
  page,
  lastPage,
  onPage,
  total,
  perPage,
  className = "",
}: {
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
  total?: number;
  perPage?: number;
  className?: string;
}) {
  const last = Math.max(1, lastPage);
  const button =
    "h-8 min-w-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600";
  // Up to 5 page numbers around the current one.
  const start = Math.max(1, Math.min(page - 2, last - 4));
  const pages = Array.from({ length: Math.min(5, last) }, (_, i) => start + i);
  const from = total !== undefined && perPage ? (page - 1) * perPage + 1 : null;
  const to =
    from !== null && total !== undefined ? Math.min(total, page * perPage!) : null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3 text-xs text-slate-500 ${className}`}
    >
      <span>
        {from !== null && to !== null && total !== undefined
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${page} of ${last}`}
      </span>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={button}
        >
          Previous
        </button>
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            aria-current={number === page ? "page" : undefined}
            onClick={() => onPage(number)}
            className={
              number === page
                ? "h-8 min-w-8 rounded-lg bg-primary-600 px-2.5 text-xs font-semibold text-white"
                : button
            }
          >
            {number}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
          className={button}
        >
          Next
        </button>
      </span>
    </div>
  );
}

/** Kept for older callers; same as PagerBar. */
export function ManagePager(props: {
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
}) {
  return <PagerBar {...props} />;
}

/** Small text button used for Deactivate / Restore inside a row. */
export function RowAction({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: "danger" | "success";
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`opacity-0 transition-opacity hover:underline group-hover:opacity-100 disabled:opacity-40 ${
        tone === "danger" ? "text-rose-600" : "text-emerald-700"
      }`}
    >
      {children}
    </button>
  );
}

/** Pill-style segmented tabs (replaces the old underline tab bars). */
export function ManageTabs<T extends string | number>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: ReactNode; count?: number | null }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={String(tab.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-slate-600 hover:text-primary-700"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={`text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pages the rows of any table body: renders `perPage` of the given <tr>s
 * plus a pager row. Use inside <tbody> around an already-mapped row list.
 */
export function PagedRows({
  children,
  colSpan,
  perPage = 10,
}: {
  children: ReactNode;
  colSpan: number;
  perPage?: number;
}) {
  const rows = Children.toArray(children);
  const {
    rows: visible,
    page,
    lastPage,
    total,
    setPage,
  } = usePagedRows(rows, perPage, rows.length);
  if (rows.length === 0) return null;
  return (
    <>
      {visible}
      <tr>
        <td colSpan={colSpan} className="p-0">
          <PagerBar
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPage={setPage}
          />
        </td>
      </tr>
    </>
  );
}
