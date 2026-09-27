export interface Notification {
  id: number;
  customer_id: number;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  order_id: number | null;
  order_status: string | null;
  is_read: boolean;
  read_at: string | null;
  data: Record<string, unknown> | null;
  action_url: string | null;
  created_at: string;
}
