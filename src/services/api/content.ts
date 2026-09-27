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

export async function getHeroStats(): Promise<HeroStat[]> {
  const { data } = await apiClient.get<HeroStat[]>("/customer/hero-stats");
  return data;
}
