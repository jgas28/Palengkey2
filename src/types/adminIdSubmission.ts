export type IdSubmissionFilter = "pending" | "approved" | "rejected" | "all";

export interface AdminIdSubmissionCustomerSummary {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
}

export interface AdminIdSubmissionEntry {
  id: number;
  customer_id: number;
  order_id: number | null;
  id_type: string;
  id_number: string | null;
  full_name: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  customer: AdminIdSubmissionCustomerSummary | null;
  order: { id: number; order_number: string } | null;
}

export interface AdminIdSubmissionDetail {
  id: number;
  customer: { id: number; name: string; email: string; phone: string } | null;
  order: { id: number; order_number: string } | null;
  id_type: string;
  id_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by_user: { id: number; name: string } | null;
  submitted_at: string;
}

export interface AdminIdSubmissionPage {
  data: AdminIdSubmissionEntry[];
  current_page: number;
  last_page: number;
}

export interface AdminIdSubmissionCounts {
  pending: number;
  approved: number;
  rejected: number;
}
