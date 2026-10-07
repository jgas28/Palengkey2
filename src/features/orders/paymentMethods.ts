/** Mirrors Order::PAYMENT_METHOD_LABELS / CASHLESS_METHODS on the backend. */

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  qrph: "QR Ph",
  bpi: "BPI",
  card: "Visa / Mastercard",
  gcash: "GCash",
  maya: "Maya",
  ubp: "UnionBank",
};

/** Paid online before the order is confirmed — the order waits in "pending_payment". */
export const CASHLESS_PAYMENT_METHODS = ["qrph", "bpi", "card", "gcash", "maya", "ubp"];

export function paymentMethodLabel(method: string | null | undefined): string {
  const key = (method ?? "").toLowerCase();
  return PAYMENT_METHOD_LABELS[key] ?? key.toUpperCase();
}
