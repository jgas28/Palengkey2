export type AdminMarketStatus = 0 | 1 | 2;

export interface AdminMarket {
  id: number;
  name: string;
  location: string;
  address: string;
  latitude: string;
  longitude: string;
  status: AdminMarketStatus;
  cutoff_time: string | null;
  cutoff_timezone: string | null;
  image_url: string | null;
  created_at: string | null;
}

export interface AdminMarketPage {
  data: AdminMarket[];
  current_page: number;
  last_page: number;
}
