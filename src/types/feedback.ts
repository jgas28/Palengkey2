export interface OrderFeedback {
  id: number;
  order_id: number;
  customer_id: number;
  market_id: number | null;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface SubmitFeedbackPayload {
  order_id: number;
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
}
