export interface AdminRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
  market_id: number;
  active_orders_count: number;
  market: { id: number; name: string } | null;
}

export interface AdminRiderPage {
  data: AdminRider[];
  current_page: number;
  last_page: number;
}

export interface AdminRiderTrackingEntry {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  market_name: string | null;
  latitude: number | null;
  longitude: number | null;
  last_location_update: string | null;
}
