import type { PaginatedResponse } from "@/types/pagination";

export interface DeliveryAreas {
  available: string[];
  coming_soon: string[];
}

export interface FeaturedReview {
  public_customer_name: string;
  comment: string;
  rating: number;
  market_name: string | null;
}

/** One written review on the public reviews page. */
export interface PublicReview extends FeaturedReview {
  id: number;
  /** YYYY-MM-DD */
  created_at: string | null;
}

export interface ReviewsPage extends PaginatedResponse<PublicReview> {
  /** Written reviews per star (the page lists only 4s and 5s). */
  breakdown: Record<"4" | "5", number>;
}

export interface HeroStat {
  value: string;
  label: string;
}
