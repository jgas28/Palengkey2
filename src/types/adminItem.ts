export interface AdminItemImage {
  id: number;
  url: string;
  sort_order: number;
}

export interface AdminItemMarketListing {
  market_id: number;
  price: number | null;
  /** Vendor price with the app markup applied (what customers pay). */
  customer_price?: number | null;
  market_name?: string | null;
  is_available: boolean;
  cutoff_time: string | null;
}

export interface AdminItem {
  id: number;
  sku?: string;
  name: string;
  description: string | null;
  image_url: string;
  updated_at?: string | null;
  markets_count?: number | null;
  markup_percent?: number;
  status: boolean;
  category_id: number;
  category: string | null;
  type_id: number | null;
  type: string | null;
  unit_id: number;
  unit: string | null;
  /** Per-item bulk threshold override (kg); null = use the category's. */
  bulk_min_kg: string | null;
  category_bulk_min_kg: string | null;
  /** Per-item ₱/kg bulk discount override; null = use the category's. */
  bulk_discount_per_kg: string | null;
  category_bulk_discount_per_kg: string | null;
  images: AdminItemImage[];
  market: AdminItemMarketListing | null;
}

export interface AdminItemListPage {
  data: AdminItem[];
  current_page: number;
  last_page: number;
  total?: number;
  summary?: AdminItemSummary;
}

export interface AdminItemSummary {
  total: number;
  active: number;
  needs_attention: number;
  updated_today: number;
}

export interface LookupOption {
  id: number;
  name: string;
  short_name?: string;
}

export interface AdminMarketOption {
  id: number;
  name: string;
  location: string | null;
  status: number;
}
