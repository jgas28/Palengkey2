import type { CustomerSettings } from "@/types/settings";

/** Mirrors Setting::calculateServiceFee() on the backend exactly. */
export function calculateServiceFee(
  subtotal: number,
  settings: CustomerSettings,
): number {
  if (subtotal < settings.minimum_order_amount) {
    return settings.service_fee_fixed_amount;
  }

  const fee = Math.round(subtotal * (settings.service_fee_percent / 100) * 100) / 100;
  return settings.service_fee_max_amount > 0
    ? Math.min(fee, settings.service_fee_max_amount)
    : fee;
}

/** Mirrors CheckoutController's fixed 12% VAT-of-delivery-fee decomposition. */
export function calculateDeliveryVat(deliveryFeeGross: number): number {
  return Math.round(deliveryFeeGross * 0.12 * 100) / 100;
}
