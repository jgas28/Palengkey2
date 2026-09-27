export type HeroPageName = "home" | "global";

export interface AdminHeroContent {
  id: number;
  page_name: HeroPageName;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  cta_text: string;
  cta_link: string;
  cta_text_2: string | null;
  cta_link_2: string | null;
  is_active: boolean;
  sequence: number;
}
