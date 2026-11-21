import type { SavedVoucher } from "@/services/api/adminVouchers";

/** "Voucher created." plus who is being emailed, for personal vouchers. */
export function savedMessage(action: "created" | "updated", saved: SavedVoucher): string {
  const { sending = 0, skipped = 0 } = saved.emails ?? {};
  const plural = (n: number) => `${n} customer${n === 1 ? "" : "s"}`;
  return [
    `Voucher ${action}.`,
    sending > 0 ? `Emailing ${plural(sending)}.` : null,
    skipped > 0 ? `${plural(skipped)} not emailed (promo emails off or no valid email).` : null,
  ]
    .filter(Boolean)
    .join(" ");
}
