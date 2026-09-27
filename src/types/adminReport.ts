export interface SalesReportOrder {
  id: number;
  order_number: string;
  created_at: string;
  market_name: string | null;
  customer_name: string | null;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total_amount: number;
  payment_method: string;
}

export interface SalesByMarket {
  market_id: number;
  market_name: string | null;
  total_orders: number;
  total_sales: number;
}

export interface SalesReport {
  start_date: string;
  end_date: string;
  total_orders: number;
  total_sales: number;
  total_items: number;
  average_order_value: number;
  sales_by_market: SalesByMarket[];
  orders: SalesReportOrder[];
}

export interface VerificationReportEntry {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  id_type: string;
  id_number: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface VerificationsReport {
  start_date: string;
  end_date: string;
  total_submissions: number;
  approved: number;
  rejected: number;
  pending: number;
  approval_rate: number;
  verifications: VerificationReportEntry[];
}

export interface MarketActivityEntry {
  market_id: number;
  market_name: string | null;
  total_orders: number;
  total_sales: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
}

export interface RiderActivityEntry {
  rider_id: number;
  rider_name: string;
  total_deliveries: number;
  total_delivery_amount: number;
  average_delivery_value: number;
}

export interface ActivitiesReport {
  start_date: string;
  end_date: string;
  market_activity: MarketActivityEntry[];
  rider_activity: RiderActivityEntry[];
}
