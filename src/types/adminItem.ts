export interface AdminItemImage {
  id: number;
  url: string;
  sort_order: number;
}

export interface AdminItemMarketListing {
  market_id: number;
  price: number | null;
  is_available: boolean;
  cutoff_time: string | null;
}

export interface AdminItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
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
