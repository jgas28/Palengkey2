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

export interface HeroStat {
  value: string;
  label: string;
}
