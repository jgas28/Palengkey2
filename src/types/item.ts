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
}
