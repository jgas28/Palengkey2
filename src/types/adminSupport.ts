export type SupportThreadStatus = "open" | "closed";

export interface AdminSupportThread {
  id: number;
  customer_id: number;
  market_id: number;
  order_id: number | null;
  subject: string;
  status: SupportThreadStatus;
  last_message_at: string | null;
  unread_customer_count: number;
  customer: { id: number; fname: string; lname: string } | null;
  market: { id: number; name: string } | null;
  order: { id: number; order_number: string } | null;
  // Raw SupportMessage attributes (unlike the formatted shape from the
  // messages endpoint — this comes from an eager-loaded relation).
  latest_message: { id: number; sender_type: "customer" | "admin"; body: string } | null;
}

export interface AdminSupportThreadPage {
  data: AdminSupportThread[];
  current_page: number;
  last_page: number;
}

export interface AdminSupportMessage {
  id: number;
  sender_type: "customer" | "admin";
  sender_name: string;
  body: string;
  created_at: string | null;
}
