export interface ItemSummary {
  id: number;
  name: string;
  image: string | null;
  price: number | null;
  base_price: number | null;
  unit: string | null;
  category: string | null;
  type: string | null;
  is_muslim_friendly: boolean;
  cutoff_time: string | null;
  is_cutoff: boolean;
  /** Bulk tier — kg of this item that unlocks bulk_price; null when not bulk-eligible. */
  bulk_min_kg: number | null;
  /** Wholesale per-unit price once bulk_min_kg is reached. */
  bulk_price: number | null;
  /** Max delivery covered by BULK-FREESHIP when bulk is reached. */
  bulk_delivery_subsidy_cap: number | null;
}

export interface ItemDetail {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  type: string | null;
  is_muslim_friendly: boolean;
  unit: string | null;
  price: number;
  base_price: number;
  price_at: string | null;
  cutoff_time: string | null;
  is_cutoff: boolean;
  /** Bulk tier — kg of this item that unlocks bulk_price; null when not bulk-eligible. */
  bulk_min_kg: number | null;
  /** Wholesale per-unit price once bulk_min_kg is reached. */
  bulk_price: number | null;
  /** Max delivery covered by BULK-FREESHIP when bulk is reached. */
  bulk_delivery_subsidy_cap: number | null;
}
