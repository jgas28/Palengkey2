export interface AdminInventoryRow {
  item_id: number;
  name: string;
  unit: string | null;
  price: string | null;
  is_available: boolean;
  cutoff_time: string | null;
}

export interface AdminInventoryBoard {
  market_id: number;
  items: AdminInventoryRow[];
}

export interface AdminInventoryUpdateResult {
  updated: number;
  errors: string[];
  items: AdminInventoryRow[];
}
