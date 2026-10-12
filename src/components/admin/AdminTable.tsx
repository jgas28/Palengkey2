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
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-background text-xs uppercase text-text-muted">
          <tr>
            {head.map((label, index) => (
              <th key={index} className="whitespace-nowrap px-4 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
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
      className={`inline-flex whitespace-nowrap rounded-pill px-2 py-0.5 text-xs font-semibold ${
        active ? "bg-primary-50 text-status-delivered" : "bg-background text-text-muted"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export const adminTd = "px-4 py-3 align-middle text-text-muted";
export const adminTdStrong = "px-4 py-3 align-middle font-medium text-text";
