import { apiClient } from "@/services/api/client";
import type { AuthResponse, AuthUser, OtpChannel } from "@/types/auth";

export interface RegisterPayload {
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  privacy_policy: boolean;
  terms_conditions: boolean;
  device_id?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_id: string;
  device_name?: string;
  platform?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  device_id?: string;
  device_name?: string;
  platform?: string;
}

export interface MessageResponse {
  message: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/customer/register", payload);
  return data;
}

export interface GoogleLoginPayload {
  /** Google ID token — the API verifies it with Google. */
  id_token: string;
  device_id: string;
  device_name?: string;
  platform?: string;
}

/** Same response as login(): token is null until the email OTP is verified. */
export async function googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/customer/auth/google", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/customer/login", payload);
  return data;
}

/**
 * The backend returns {token, user} only when this call is completing the
 * approved-account 2FA challenge (device_id supplied + account approved).
 * For a plain post-registration email verification it returns the raw
 * customer row instead — callers without a token yet must check for
 * `token` on the result; callers who already hold a token from register()
 * should just re-fetch me() afterward to refresh email_verified_at.
 */
export async function verifyOtp(
  payload: VerifyOtpPayload,
): Promise<Partial<AuthResponse>> {
  const { data } = await apiClient.post<Partial<AuthResponse>>(
    "/customer/verify/otp",
    payload,
  );
  return data;
}

export async function resendOtp(
  email: string,
  channel?: OtpChannel,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/customer/resend/otp", {
    email,
    channel,
  });
  return data;
}

export async function forgotPassword(
  email: string,
  channel?: OtpChannel,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/customer/forgot-password", {
    email,
    channel,
  });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/customer/reset-password",
    payload,
  );
  return data;
}

export async function me(): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.get<{ user: AuthUser }>("/customer/me");
  return data;
}

export async function logout(): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/customer/logout");
  return data;
}

export async function logoutAll(): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/customer/logout-all");
  return data;
}
