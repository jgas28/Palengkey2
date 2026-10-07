import type { CartRecipeBundle } from "@/types/paluto";

export interface CartItemRow {
  id: number;
  item_id: number;
  name: string;
  image: string | null;
  unit: string | null;
  price: string;
  unit_price: string;
  base_unit_price: string;
  quantity: number;
  type: string | null;
  category: string | null;
  weight_kg: number | null;
  customer_note: string | null;
  item_quantity: number;
  subtotal: string;
  cutoff_time: string | null;
  is_cutoff: boolean;
  /** Priced at the bulk (wholesale) tier — `unit_price` is the bulk price. */
  is_bulk?: boolean;
  /** Per-unit price without the bulk tier, for the strikethrough. */
  regular_unit_price?: string;
  /** null when this item isn't bulk-eligible. */
  bulk_min_kg?: number | null;
}

export interface CartBulkProgress {
  item_id: number;
  name: string;
  total_kg: number;
  threshold_kg: number;
  qualifies: boolean;
}

export interface CartBulkSummary {
  active: boolean;
  voucher_code: string;
  /** Decimal string — max delivery covered when active. */
  delivery_subsidy_cap: string;
  /** Decimal string — total saved by wholesale pricing in this cart. */
  savings: string;
  items: CartBulkProgress[];
}

export interface CartResponse {
  items: CartItemRow[];
  total: number | string;
  market_id?: number | null;
  /** Recipe (Paluto) bundles in the cart — kept separate from `items`, never merged in. */
  recipe_bundles?: CartRecipeBundle[];
  bulk?: CartBulkSummary;
}
