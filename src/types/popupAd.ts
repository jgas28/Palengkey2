export interface PopupAd {
  id: number;
  type: string;
  type_label: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  badge_text: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string;
  updated_at: string | null;
  voucher: { id: number; code: string; description: string | null } | null;
}
