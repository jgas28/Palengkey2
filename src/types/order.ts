import type { CanonicalOrderStatus, CookingStatus } from "@/features/orders/orderStatus";

export interface OrderItem {
  item_id: number;
  item_name: string;
  unit_name: string | null;
  quantity: number;
  price: string;
  price_at_purchase: string;
  subtotal: number | string;
  customer_note: string | null;
  /** Catalog photo, when the item still exists. */
  image?: string | null;
}

export type PaymentMethod =
  "cod" | "qrph" | "bpi" | "paymongo" | "card" | "gcash" | "maya" | "ubp";
export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export interface CashlessPayment {
  qr_url: string | null;
  redirect_url: string | null;
  reference: string | null;
  status: string | null;
}

export interface OrderRider {
  id: number;
  name: string;
  phone: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
}

export interface OrderRecipeBundleStall {
  id: number;
  name: string;
  contact_phone: string | null;
}

export interface OrderRecipeBundle {
  id: number;
  recipe_name: string;
  paluto_stall_id: number | null;
  stall_name: string | null;
  stall: OrderRecipeBundleStall | null;
  quantity: string;
  pricing_unit: "kg" | "serving";
  cooking_fee: string;
  /** Only meaningful when paluto_stall_id is set (a "Cook for Me" bundle). */
  cooking_status: CookingStatus;
}

export interface Order {
  id: number;
  order_number: string;
  invoice_series_number: string | null;
  customer_id: number;
  market_id: number;
  /**
   * Backend can still return legacy 4-stage status strings (see
   * LEGACY_STATUS_MAP in orderStatus.ts) — always read this through
   * `normalizeOrderStatus()` rather than comparing raw strings. Widened to
   * `(string & {})` so legacy/unknown values still type-check while
   * canonical ones get autocomplete.
   */
  status: CanonicalOrderStatus | (string & {});
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  contact_name: string;
  contact_phone: string;
  delivery_address: string;
  latitude: number;
  longitude: number;
  subtotal: number | string;
  delivery_fee: number | string;
  vat: number | string;
  service_fee: number | string;
  voucher_discount: number | string;
  /** Saved by wholesale bulk pricing (already reflected in item prices). */
  bulk_discount?: number | string;
  /** BULK-FREESHIP delivery subsidy taken off the total. */
  bulk_delivery_subsidy?: number | string;
  voucher_code: string | null;
  total_amount: number | string;
  distance_meters: number | null;
  is_reservation: boolean;
  scheduled_delivery_time: string | null;
  delivery_slot: string | null;
  notes: string | null;
  items: OrderItem[];
  recipe_bundles: OrderRecipeBundle[];
  cashless_payment: CashlessPayment | null;
  rider: OrderRider | null;
  /** Where the order is bought — for the route map. Coordinates are decimal strings. */
  market?: {
    id: number;
    name: string;
    latitude: string | number | null;
    longitude: string | number | null;
  } | null;
  cancellation_reason: string | null;
  delivery_photo: string | null;
  received_at?: string;
  /** When each step happened (null until it does). */
  accepted_at?: string | null;
  prepared_at?: string | null;
  out_for_delivery_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface OrderStats {
  total_orders: number;
  delivered_count: number;
  cancelled_count: number;
  pending_count: number;
  total_spent: number;
}

export interface RiderLocation {
  rider_id: number;
  latitude: number;
  longitude: number;
  updated_at: string | null;
}
