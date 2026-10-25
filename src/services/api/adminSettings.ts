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
}): Promise<MaintenanceState & { message: string }> {
  const { data } = await adminApiClient.put<MaintenanceState & { message: string }>(
    "/admin/maintenance",
    payload,
  );
  return data;
}
