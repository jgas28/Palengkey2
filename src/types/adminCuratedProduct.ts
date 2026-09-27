export type CuratedSection = "highlighted_products" | "best_deals";

export interface AdminCuratedProduct {
  id: number;
  section: CuratedSection;
  sort_order: number;
  is_active: boolean;
  item: {
    id: number;
    name: string;
    image: string | null;
    category: string | null;
  };
}
