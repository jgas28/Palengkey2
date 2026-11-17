export type VoucherTarget = "subtotal" | "service_fee" | "delivery_fee";

export interface VoucherCustomer {
  id: number;
  fname: string | null;
  lname: string | null;
  email: string;
}

export interface AdminVoucher {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  applies_to: VoucherTarget[];
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  per_customer_limit: number;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
  /** Only the listed customers can see or use it. */
  for_specific_customers: boolean;
  customers: VoucherCustomer[];
  market_id: number | null;
  market: { id: number; name: string } | null;
  starts_at: string | null;
  expires_at: string | null;
}

export interface AdminVoucherPage {
  data: AdminVoucher[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}
