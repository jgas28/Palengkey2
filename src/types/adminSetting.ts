export type SettingFieldType = "number" | "time" | "string";

export interface SettingField {
  key: string;
  label: string;
  default: string | number;
  group: string;
  type: SettingFieldType;
  value: string | number;
}

export type SettingGroups = Record<string, SettingField[]>;

export type SettingUpdatePayload = Record<string, string | number>;
