import { adminApiClient } from "@/services/api/adminClient";
import type {
  EmailAudience,
  EmailBlastStats,
  PushAudience,
  PushBlastStats,
  SmsAudience,
  SmsBlastStats,
} from "@/types/adminBlast";

export async function getSmsBlastStats(): Promise<SmsBlastStats> {
  const { data } = await adminApiClient.get<SmsBlastStats>("/admin/sms-blast/stats");
  return data;
}

export interface SendSmsBlastPayload {
  category: "promo" | "advertisement" | "announcement";
  audience: SmsAudience;
  numbers?: string;
  message: string;
  sendername?: string;
}

export async function sendSmsBlast(
  payload: SendSmsBlastPayload,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    "/admin/sms-blast/send",
    payload,
  );
  return data;
}

export async function getEmailBlastStats(): Promise<EmailBlastStats> {
  const { data } = await adminApiClient.get<EmailBlastStats>("/admin/email-blast/stats");
  return data;
}

export interface SendEmailBlastPayload {
  audience: EmailAudience;
  subject: string;
  body: string;
}

export async function sendEmailBlast(
  payload: SendEmailBlastPayload,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    "/admin/email-blast/send",
    payload,
  );
  return data;
}

export async function getPushBlastStats(): Promise<PushBlastStats> {
  const { data } = await adminApiClient.get<PushBlastStats>("/admin/push-blast/stats");
  return data;
}

export interface SendPushBlastPayload {
  audience: PushAudience;
  title: string;
  body: string;
  url?: string;
}

export async function sendPushBlast(
  payload: SendPushBlastPayload,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    "/admin/push-blast/send",
    payload,
  );
  return data;
}
