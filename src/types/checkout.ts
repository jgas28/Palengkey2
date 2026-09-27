import type { Order } from "@/types/order";

export interface DeliveryFeeResponse {
  fee: number;
  distance_km: number;
  eta_min: number;
  eta_max: number;
  market_name?: string;
  debug?: string;
}

export type CheckoutPaymentMethod = "cod" | "qrph" | "bpi";

export interface CheckoutPayload {
  address_id: number;
  payment_method: CheckoutPaymentMethod;
  item_ids: number[];
  /** Selected `cart_recipe_bundles` ids to check out alongside plain items. */
  recipe_bundle_ids?: number[];
  voucher_code?: string;
  order_later_slot?: string;
  notes?: string;
}

export interface CheckoutSuccessResponse {
  message: string;
  order: Order;
  qrph: { qr_url: string; reference: string | null; status: string | null } | null;
  bpi: { redirect_url: string; reference: string | null; status: string | null } | null;
}

/** Mirrors CheckoutController::orderLaterSlots() exactly. */
export const ORDER_LATER_SLOTS = [
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
] as const;
