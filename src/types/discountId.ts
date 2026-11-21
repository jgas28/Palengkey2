export type DiscountIdType = "pwd" | "senior";
export type DiscountIdStatus = "pending" | "approved" | "rejected";

/** The customer's PWD / Senior Citizen ID, as the customer sees it. */
export interface DiscountIdStatusInfo {
  id: number;
  type: DiscountIdType;
  type_label: string;
  id_number: string;
  full_name: string;
  status: DiscountIdStatus;
  /** Only set when rejected: what to fix. */
  review_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface AdminDiscountId {
  id: number;
  type: DiscountIdType;
  type_label: string;
  id_number: string;
  full_name: string;
  status: DiscountIdStatus;
  submitted_at: string;
  reviewed_at: string | null;
  customer: { id: number; name: string; email: string | null; phone: string | null } | null;
}

export interface AdminDiscountIdDetail extends AdminDiscountId {
  files: ("front" | "back" | "selfie")[];
  reviewed_by: string | null;
  review_notes: string | null;
}

export type DiscountIdFilter = DiscountIdStatus | "all";

export interface AdminDiscountIdPage {
  discount_ids: {
    data: AdminDiscountId[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  counts: Record<DiscountIdFilter, number>;
}
