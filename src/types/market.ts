export interface Market {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  has_items: boolean;
  distance: number | null;
  /** Closed by an admin: Order Later only until closed_until. */
  is_closed?: boolean;
  closed_until?: string | null;
  reopens_on?: string | null;
  closed_reason?: string | null;
}
