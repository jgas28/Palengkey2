export type AdminOrderStatus =
  | "pending_payment"
  | "order_received"
  | "order_confirmed"
  | "preparing_items"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface AdminOrderItem {
  id: number;
  item_id: number;
  item_name: string;
  unit_name: string | null;
  selected_size: string | null;
  customer_note: string | null;
  weight_kg: string;
  /** Quantity ordered — the authoritative field; the API's separate
   * decimal `quantity`/`price`/`price_at_purchase` fields duplicate this
   * and `subtotal` and aren't consumed here. */
  item_quantity: number;
  /** Decimal string. For Paluto/recipe ingredient lines this is the amount to buy
   * (e.g. "1.200" kg) — those lines don't use item_quantity. */
  quantity: string;
  /** Set when this line is an ingredient of a recipe bundle (Buy Raw or a stall's dish). */
  order_recipe_bundle_id: number | null;
  /** Customer price per unit (decimal string). */
  price?: string | null;
  subtotal: string;
  /** Vendor's listed price per unit at checkout, before markup (admin only). */
  vendor_list_price?: string | null;
  /** What staff actually paid per unit after haggling; null = not recorded. */
  vendor_price?: string | null;
  vendor_note?: string | null;
  vendor_price_at?: string | null;
}

export interface AdminOrderCustomer {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
}

export interface AdminOrderRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
}

export type CookingStatus =
  | "pending"
  | "preparing"
  | "cooking"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered";

export interface AdminOrderRecipeBundle {
  id: number;
  recipe_name: string;
  paluto_stall_id: number | null;
  stall_name: string | null;
  stall: { id: number; name: string; contact_phone: string | null } | null;
  quantity: string;
  pricing_unit: "kg" | "serving";
  cooking_fee: string;
  cooking_status: CookingStatus;
}

export interface AdminOrderSummary {
  id: number;
  order_number: string;
  customer_id: number;
  market_id: number;
  status: AdminOrderStatus;
  total_amount: string;
  payment_method: string;
  payment_status: string;
  contact_name: string;
  contact_phone: string;
  is_reservation: boolean;
  scheduled_delivery_time: string | null;
  created_at: string;
  customer: AdminOrderCustomer | null;
  rider: AdminOrderRider | null;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  invoice_series_number: string | null;
  delivery_address: string;
  latitude: string;
  longitude: string;
  subtotal: string;
  service_fee: string;
  delivery_fee: string;
  vat: string;
  voucher_discount: string;
  bulk_discount?: string;
  bulk_delivery_subsidy?: string;
  voucher_code: string | null;
  distance_meters: string | null;
  payment_reference: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  prepared_at: string | null;
  out_for_delivery_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  items: AdminOrderItem[];
  recipe_bundles: AdminOrderRecipeBundle[];
  voucher: { id: number; code: string } | null;
  cashless_payment: { provider: string; method: string; status: string; reference: string | null } | null;
}

export interface AdminOrderPage {
  data: AdminOrderSummary[];
  current_page: number;
  last_page: number;
}

export type AdminOrderCounts = Partial<Record<AdminOrderStatus, number>>;

export interface AdminActiveRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
}
