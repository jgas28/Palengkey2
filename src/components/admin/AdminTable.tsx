import { useState, type ReactNode } from "react";

/** The admin list layout (same look as Vouchers/Users): a bordered, scrollable table. */
export default function AdminTable({
  head,
  children,
}: {
  head: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            {head.map((label, index) => (
              <th key={index} className="whitespace-nowrap px-5 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

/** Small square photo for the first column; a soft placeholder when missing or broken. */
export function AdminThumb({
  src,
  alt = "",
}: {
  src: string | null | undefined;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-lg bg-background object-cover"
    />
  ) : (
    <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-lg bg-background" />
  );
}

/** Green "Active" / grey "Inactive" pill. */
export function AdminStatusPill({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export const adminTd = "px-5 py-3 align-middle text-slate-500";
export const adminTdStrong = "px-5 py-3 align-middle font-semibold text-slate-900";
