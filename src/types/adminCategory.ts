export interface AdminCategory {
  id: number;
  name: string;
  image: string | null;
  image_url: string;
  status: boolean;
  active_items_count: number;
  /** Bulk tier threshold (kg) for items in this category; null = no bulk pricing. */
  bulk_min_kg: string | null;
}

export interface AdminCategoryPage {
  data: AdminCategory[];
  current_page: number;
  last_page: number;
}
