export interface SmsBlastStats {
  customers_with_phone: number;
  sms_opted_in: number;
  verified_with_phone: number;
}

export interface EmailBlastStats {
  customers_with_email: number;
  email_opted_in: number;
}

export type SmsAudience = "opted_in" | "verified" | "all_with_phone" | "manual";
export type EmailAudience = "opted_in" | "all_with_email";

export interface PushBlastStats {
  customers_with_device: number;
  push_opted_in: number;
}

export type PushAudience = "opted_in" | "all_with_device";
