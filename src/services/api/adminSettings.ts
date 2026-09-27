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
