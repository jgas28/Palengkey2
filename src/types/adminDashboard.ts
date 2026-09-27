export interface DashboardOrder {
  id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  created_at: string;
  market?: { id: number; name: string } | null;
  customer?: { id: number; fname: string; lname: string } | null;
}

export interface MarketDashboard {
  scope: "market";
  active_orders_count: number;
  status_breakdown: {
    order_received: number;
    order_confirmed: number;
    preparing_items: number;
    out_for_delivery: number;
  };
  today_sales: number;
  recent_orders: DashboardOrder[];
}

export interface PlatformDashboard {
  scope: "platform";
  total_markets: number;
  total_admins: number;
  total_riders: number;
  total_orders: number;
  today_sales: number;
  total_sales: number;
  total_items_sold: number;
  total_customers: number;
  verified_customers: number;
  pending_verifications: number;
  pending_id_submissions: number;
  rejected_verifications: number;
  sales_per_market: { id: number; name: string; total_sales: string | null }[];
  recent_orders: DashboardOrder[];
}

export type AdminDashboard = MarketDashboard | PlatformDashboard;
