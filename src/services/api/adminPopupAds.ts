import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminPopupAd,
  AdminPopupAdPage,
  PopupAdType,
  VoucherOption,
} from "@/types/adminPopupAd";

export async function listAdminPopupAds(
  search = "",
  page = 1,
): Promise<AdminPopupAdPage> {
  const { data } = await adminApiClient.get<AdminPopupAdPage>("/admin/popup-ads", {
    params: { search: search || undefined, page },
  });
  return data;
}

export async function listPopupAdVouchers(): Promise<VoucherOption[]> {
  const { data } = await adminApiClient.get<VoucherOption[]>("/admin/popup-ads/vouchers");
  return data;
}

export interface PopupAdPayload {
  type: PopupAdType;
  voucher_id?: number;
  title: string;
  subtitle?: string;
  body?: string;
  badge_text?: string;
  cta_label?: string;
  cta_url?: string;
  image?: File;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  sort_order?: number;
}

function toFormData(payload: PopupAdPayload): FormData {
  // Optional fields are always sent: an empty string (null on the API) is how
  // an edit clears a subtitle, voucher or date.
  const form = new FormData();
  form.append("type", payload.type);
  form.append("voucher_id", payload.voucher_id ? String(payload.voucher_id) : "");
  form.append("title", payload.title);
  form.append("subtitle", payload.subtitle ?? "");
  form.append("body", payload.body ?? "");
  form.append("badge_text", payload.badge_text ?? "");
  form.append("cta_label", payload.cta_label ?? "");
  form.append("cta_url", payload.cta_url ?? "");
  if (payload.image) form.append("image", payload.image);
  form.append("is_active", payload.is_active ? "1" : "0");
  form.append("starts_at", payload.starts_at ?? "");
  form.append("ends_at", payload.ends_at ?? "");
  form.append("sort_order", String(payload.sort_order ?? 0));
  return form;
}

export async function createAdminPopupAd(payload: PopupAdPayload): Promise<AdminPopupAd> {
  const { data } = await adminApiClient.post<AdminPopupAd>(
    "/admin/popup-ads",
    toFormData(payload),
  );
  return data;
}

export async function updateAdminPopupAd(
  popupAdId: number,
  payload: PopupAdPayload,
): Promise<AdminPopupAd> {
  const form = toFormData(payload);
  const { data } = await adminApiClient.post<AdminPopupAd>(
    `/admin/popup-ads/${popupAdId}`,
    form,
  );
  return data;
}

export async function deleteAdminPopupAd(popupAdId: number): Promise<void> {
  await adminApiClient.delete(`/admin/popup-ads/${popupAdId}`);
}
