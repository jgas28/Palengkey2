export interface RawSupportMessage {
  id: number;
  support_thread_id: number;
  customer_id: number | null;
  user_id: number | null;
  sender_type: "customer" | "admin";
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface SupportThread {
  id: number;
  customer_id: number;
  market_id: number | null;
  order_id: number | null;
  subject: string;
  status: string;
  last_message_at: string | null;
  order?: { id: number; order_number: string } | null;
  market?: { id: number; name: string } | null;
  latestMessage?: RawSupportMessage | null;
}

export interface FormattedSupportMessage {
  id: number;
  sender_type: "customer" | "admin";
  sender_name: string;
  body: string;
  created_at: string | null;
}

export interface SupportableOrder {
  id: number;
  order_number: string;
  status: string;
  total_amount: number | string;
  market?: { id: number; name: string } | null;
  supportThread?: SupportThread | null;
}
