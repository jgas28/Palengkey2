export type FeedbackFilter = "bad" | "five_star" | "unreviewed" | "reviewed" | "all";
export type FeedbackStatus = "new" | "reviewed";

export interface AdminOrderFeedback {
  id: number;
  order_id: number;
  customer_id: number;
  market_id: number;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  status: FeedbackStatus;
  admin_notes: string | null;
  // Laravel serializes the loaded `reviewedBy` relation into this same
  // snake_case key, overriding the raw reviewed_by FK column — this
  // controller always eager-loads it, so it's the nested user, not an id.
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  created_at: string;
  customer: { id: number; fname: string; lname: string } | null;
  market: { id: number; name: string } | null;
  order: { id: number; order_number: string } | null;
}

export interface AdminFeedbackPage {
  data: AdminOrderFeedback[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}

export interface FeedbackCounts {
  bad: number;
  unreviewed: number;
  reviewed: number;
  all: number;
}
