export type VerificationFilter = "pending" | "approved" | "rejected" | "all";

export interface AdminVerificationCustomerSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface AdminVerificationEntry {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  verification_status: string | null;
  id_verification_status: string | null;
  created_at: string;
  latest_verification: {
    id: number;
    id_type: string;
    status: string;
    created_at: string;
  } | null;
}

export interface AdminVerificationDetail {
  id: number;
  customer_id: number;
  customer: AdminVerificationCustomerSummary;
  id_type: string;
  id_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
  is_skipped: boolean;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by_user: { id: number; name: string } | null;
  submitted_at: string;
  customer_verification_status: string | null;
  customer_id_verification_status: string | null;
  can_review: boolean;
}

export interface AdminVerificationPage {
  data: AdminVerificationEntry[];
  current_page: number;
  last_page: number;
}

export interface AdminVerificationCounts {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface AdminUnverifiedCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  verification_status: string;
  created_at: string;
  has_pending_verification: boolean;
}

export interface AdminUnverifiedCustomerPage {
  data: AdminUnverifiedCustomer[];
  current_page: number;
  last_page: number;
}
