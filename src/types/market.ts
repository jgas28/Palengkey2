export interface Market {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  has_items: boolean;
  distance: number | null;
}
