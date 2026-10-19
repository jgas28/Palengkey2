export type PopupAdType = "promo" | "voucher" | "advertisement";

export interface AdminPopupAd {
  id: number;
  type: PopupAdType;
  voucher_id: number | null;
  title: string;
  subtitle: string | null;
  body: string | null;
  badge_text: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
}

export interface AdminPopupAdPage {
  data: AdminPopupAd[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}

export interface VoucherOption {
  id: number;
  code: string;
  description: string | null;
  is_active: boolean;
}
