export type VerificationStatus =
  "pending_admin_approval" | "pending" | "approved" | "rejected";

export type IdVerificationStatus =
  "not_submitted" | "pending_review" | "skipped" | "approved" | "rejected";

export interface AuthUser {
  id: number;
  fname: string;
  mname: string | null;
  lname: string;
  email: string;
  phone: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  verification_status: VerificationStatus;
  profile_image?: string | null;
  id_verification_status: IdVerificationStatus;
  requires_cod_verification: boolean;
  cod_verification_pending: boolean;
  needs_cod_details: boolean;
}

/** token is null when the account requires an OTP challenge before a token is issued. */
export interface AuthResponse {
  token: string | null;
  user: AuthUser;
}

export type OtpChannel = "email" | "sms";
