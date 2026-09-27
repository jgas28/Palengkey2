export interface AdminCategory {
  id: number;
  name: string;
  image: string | null;
  image_url: string;
  status: boolean;
  active_items_count: number;
}

export interface AdminCategoryPage {
  data: AdminCategory[];
  current_page: number;
  last_page: number;
}
