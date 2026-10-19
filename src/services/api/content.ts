import { apiClient } from "@/services/api/client";
import type { DeliveryAreas, FeaturedReview, HeroStat } from "@/types/content";

export async function getDeliveryAreas(): Promise<DeliveryAreas> {
  const { data } = await apiClient.get<DeliveryAreas>("/customer/delivery-areas");
  return data;
}

export async function getFeaturedReviews(): Promise<FeaturedReview[]> {
  const { data } = await apiClient.get<FeaturedReview[]>("/customer/featured-reviews");
  return data;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number | null;
}

/** Live review count and average rating for the landing page badge. */
export async function getReviewStats(): Promise<ReviewStats> {
  const { data } = await apiClient.get<ReviewStats>("/customer/review-stats");
  return data;
}

export async function getHeroStats(): Promise<HeroStat[]> {
  const { data } = await apiClient.get<HeroStat[]>("/customer/hero-stats");
  return data;
}
