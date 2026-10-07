export interface AdminPalutoStall {
  id: number;
  market_id: number;
  market_name: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  contact_phone: string | null;
  status: boolean;
  is_accepting_orders: boolean;
  prep_time_minutes: number | null;
  /** Dishes on this stall's menu, active or not. */
  dishes_count: number;
}

export interface AdminPalutoStallListPage {
  data: AdminPalutoStall[];
  current_page: number;
  last_page: number;
}
