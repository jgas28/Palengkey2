export interface Address {
  id: number;
  customer_id: number;
  label: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressPayload {
  label: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}
