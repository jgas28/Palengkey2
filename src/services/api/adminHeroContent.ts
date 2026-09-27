import { adminApiClient } from "@/services/api/adminClient";
import type { AdminHeroContent, HeroPageName } from "@/types/adminHeroContent";

export async function listAdminHeroContent(
  pageName: HeroPageName,
): Promise<AdminHeroContent[]> {
  const { data } = await adminApiClient.get<AdminHeroContent[]>("/admin/hero-content", {
    params: { page_name: pageName },
  });
  return data;
}

export interface HeroContentPayload {
  page_name: HeroPageName;
  title: string;
  subtitle?: string;
  description?: string;
  image?: File;
  cta_text: string;
  cta_link: string;
  cta_text_2?: string;
  cta_link_2?: string;
  is_active: boolean;
}

function toFormData(payload: HeroContentPayload): FormData {
  const form = new FormData();
  form.append("page_name", payload.page_name);
  form.append("title", payload.title);
  if (payload.subtitle) form.append("subtitle", payload.subtitle);
  if (payload.description) form.append("description", payload.description);
  if (payload.image) form.append("image", payload.image);
  form.append("cta_text", payload.cta_text);
  form.append("cta_link", payload.cta_link);
  if (payload.cta_text_2) form.append("cta_text_2", payload.cta_text_2);
  if (payload.cta_link_2) form.append("cta_link_2", payload.cta_link_2);
  form.append("is_active", payload.is_active ? "1" : "0");
  return form;
}

export async function createAdminHeroContent(
  payload: HeroContentPayload,
): Promise<AdminHeroContent> {
  const { data } = await adminApiClient.post<AdminHeroContent>(
    "/admin/hero-content",
    toFormData(payload),
  );
  return data;
}

export async function updateAdminHeroContent(
  heroId: number,
  payload: HeroContentPayload,
): Promise<AdminHeroContent> {
  const form = toFormData(payload);
  form.append("_method", "PATCH");
  const { data } = await adminApiClient.post<AdminHeroContent>(
    `/admin/hero-content/${heroId}`,
    form,
  );
  return data;
}

export async function deleteAdminHeroContent(heroId: number): Promise<void> {
  await adminApiClient.delete(`/admin/hero-content/${heroId}`);
}
