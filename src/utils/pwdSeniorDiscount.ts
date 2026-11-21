const round2 = (value: number) => Math.round(value * 100) / 100;

export interface PwdSeniorBreakdown {
  /** Delivery fee paid, VAT included (after any bulk subsidy). */
  deliveryFee: number;
  vat: number;
  vatExclusive: number;
  discount: number;
}

/**
 * Mirrors PwdSeniorDiscount::forDeliveryFee on the backend: VAT (12% of the fee)
 * is split off first, then 20% of what's left. ₱49 → VAT ₱5.88 → ₱43.12 → ₱8.62.
 */
export function pwdSeniorDiscount(deliveryFee: number): PwdSeniorBreakdown {
  const fee = Math.max(0, round2(deliveryFee));
  const vat = round2(fee * 0.12);
  const vatExclusive = round2(fee - vat);
  return { deliveryFee: fee, vat, vatExclusive, discount: round2(vatExclusive * 0.2) };
}
