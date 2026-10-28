export interface Voucher {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  expires_at: string | null;
  applies_to_label: string | null;
}

export interface VoucherValidation {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  /** subtotal | service_fee | delivery_fee — each gets the voucher on its own. */
  applies_to: string[] | null;
  max_discount_amount: number | null;
  min_order_amount?: number | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
}
