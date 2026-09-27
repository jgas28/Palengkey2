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
}

export interface CartResponse {
  items: CartItemRow[];
  total: number | string;
  market_id?: number | null;
  /** Recipe (Paluto) bundles in the cart — kept separate from `items`, never merged in. */
  recipe_bundles?: CartRecipeBundle[];
}
