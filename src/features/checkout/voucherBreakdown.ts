import type { VoucherValidation } from "@/types/voucher";

export type VoucherTarget = "subtotal" | "service_fee" | "delivery_fee";

export interface VoucherLine {
  target: VoucherTarget;
  label: string;
  /** Amount the voucher is applied to. */
  base: number;
  discount: number;
  /** The percentage hit max_discount_amount. */
  capped: boolean;
}

const TARGET_LABELS: Record<VoucherTarget, string> = {
  subtotal: "items subtotal",
  service_fee: "service fee",
  delivery_fee: "delivery fee",
};

/**
 * Mirrors Voucher::calculateTotalDiscount on the API (checkout recomputes it):
 * each target gets the voucher on its own, a percentage capped at
 * max_discount_amount, and never more than the amount itself.
 */
export function voucherBreakdown(
  voucher: VoucherValidation,
  amounts: Record<VoucherTarget, number>,
): { lines: VoucherLine[]; total: number } {
  const targets = (
    voucher.applies_to?.length ? voucher.applies_to : ["subtotal"]
  ) as VoucherTarget[];

  const lines = targets.map((target) => {
    const base = amounts[target] ?? amounts.subtotal;
    let discount: number;
    let capped = false;

    if (voucher.discount_type === "percentage") {
      discount = base * (voucher.discount_value / 100);
      if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
        discount = voucher.max_discount_amount;
        capped = true;
      }
    } else {
      discount = voucher.discount_value;
    }

    return {
      target,
      label: TARGET_LABELS[target] ?? target,
      base,
      discount: Math.min(discount, base),
      capped,
    };
  });

  const total =
    Math.round(lines.reduce((sum, line) => sum + line.discount, 0) * 100) / 100;
  return { lines, total };
}
