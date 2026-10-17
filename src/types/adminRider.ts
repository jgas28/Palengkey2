export interface AdminRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
  market_id: number;
  active_orders_count: number;
  delivering_count?: number;
  delivered_today_count?: number;
  market: { id: number; name: string } | null;
}

export interface AdminRiderPage {
  data: AdminRider[];
  current_page: number;
  last_page: number;
  total?: number;
  summary?: AdminRiderSummary;
}

export type AdminRiderStatusFilter = "all" | "available" | "delivering" | "offline";

export interface AdminRiderSummary {
  total: number;
  available: number;
  delivering: number;
  offline: number;
  delivered_today: number;
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
  status?: "available" | "delivering" | "offline";
  active_order?: { id: number; order_number: string; status: string } | null;
  active_orders_count?: number;
  delivered_today_count?: number;
}
