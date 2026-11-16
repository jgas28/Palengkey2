import { adminApiClient } from "@/services/api/adminClient";
import type { SettingGroups, SettingUpdatePayload } from "@/types/adminSetting";

export async function getAdminSettings(): Promise<SettingGroups> {
  const { data } = await adminApiClient.get<SettingGroups>("/admin/settings");
  return data;
}

export async function updateAdminSettings(
  payload: SettingUpdatePayload,
): Promise<SettingGroups> {
  const { data } = await adminApiClient.put<SettingGroups>("/admin/settings", payload);
  return data;
}

export interface MaintenanceState {
  enabled: boolean;
  /** ISO time customers are told to expect the site back; null = not set. */
  until: string | null;
  /** Customers see "Coming soon" instead of a back-online time. */
  coming_soon: boolean;
  changed_by: string | null;
  changed_at: string | null;
}

export const maintenanceQueryKey = ["adminMaintenance"];

/** Super admin: customer-site maintenance switch. */
export async function getMaintenance(): Promise<MaintenanceState> {
  const { data } = await adminApiClient.get<MaintenanceState>("/admin/maintenance");
  return data;
}

export async function setMaintenance(payload: {
  enabled: boolean;
  until?: string | null;
  coming_soon?: boolean;
}): Promise<MaintenanceState & { message: string }> {
  const { data } = await adminApiClient.put<MaintenanceState & { message: string }>(
    "/admin/maintenance",
    payload,
  );
  return data;
}

export interface PaymentMethodStatus {
  method: string;
  label: string;
  enabled: boolean;
  /** Shown to customers at checkout while the method is off. */
  reason: string | null;
  changed_by: string | null;
  changed_at: string | null;
}

export const paymentMethodsQueryKey = ["adminPaymentMethods"];

/** Admin / super admin: which payment methods customers can choose (all markets). */
export async function getPaymentMethods(): Promise<PaymentMethodStatus[]> {
  const { data } = await adminApiClient.get<{ data: PaymentMethodStatus[] }>(
    "/admin/payment-methods",
  );
  return data.data;
}

export async function setPaymentMethod(
  method: string,
  payload: { enabled: boolean; reason?: string | null },
): Promise<{ message: string; data: PaymentMethodStatus[] }> {
  const { data } = await adminApiClient.put<{ message: string; data: PaymentMethodStatus[] }>(
    `/admin/payment-methods/${encodeURIComponent(method)}`,
    payload,
  );
  return data;
}
